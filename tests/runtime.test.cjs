const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// A small DOM/timer model makes WebKit's child-list mutation loop reproducible.
function harness(url = 'https://mail.google.com/mail/u/0/', options = {}) {
  const nodes = [];
  const timers = new Map();
  const observers = [];
  const reads = [];
  const storageListeners = [];
  const appearanceListeners = [];
  let timerId = 0;
  let mutations = 0;
  function changed(parent) {
    mutations++;
    observers.filter((observer) => observer.targets.has(parent)).forEach((observer) => observer.callback());
  }
  function element(tag) {
    const node = {
      tagName: tag, dataset: {}, children: [], attributes: {}, parentNode: null,
      setAttribute(key, value) { this.attributes[key] = value; },
      toggleAttribute(key, enabled) { if (enabled) this.attributes[key] = ''; else delete this.attributes[key]; },
      appendChild(child) {
        if (child.parentNode) child.remove();
        child.parentNode = this;
        this.children.push(child);
        changed(this);
        return child;
      },
      remove() {
        if (!this.parentNode) return;
        const parent = this.parentNode;
        parent.children.splice(parent.children.indexOf(this), 1);
        this.parentNode = null;
        changed(parent);
      }
    };
    nodes.push(node);
    return node;
  }
  const root = element('html');
  const head = element('head');
  root.appendChild(head);
  const document = {
    documentElement: root, head, referrer: options.referrer || '',
    createElement: element,
    getElementById: (id) => nodes.find((node) => node.id === id && node.parentNode) || null,
    querySelectorAll: () => nodes.filter((node) => node.parentNode && ['link', 'fallback'].includes(node.attributes['data-pavel-safari-dark-mode']))
  };
  const appearance = { matches: true, addEventListener: (_type, fn) => appearanceListeners.push(fn) };
  const api = {
    runtime: { getURL: (file) => `safari-web-extension://test/${file}`, onMessage: { addListener() {} } },
    storage: {
      local: { get: (_defaults, callback) => reads.push(callback), set: (_items, callback) => callback() },
      onChanged: { addListener: (fn) => storageListeners.push(fn) }
    }
  };
  const context = vm.createContext({
    URL, console, document, location: new URL(url), browser: api,
    matchMedia: () => appearance,
    getComputedStyle: () => ({ getPropertyValue: () => 'applied' }),
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
      observe(target) { this.targets.add(target); }
    }
  });
  context.window = context;
  context.top = options.embedded ? {} : context;
  function run(file) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension', file), 'utf8'), context);
  }
  run('site-registry.js');
  return {
    context, registry: context.__safariDarkModeRegistry, api, document, run, reads,
    get mutations() { return mutations; },
    flush(limit = 30) {
      let count = 0;
      while (timers.size && count++ < limit) {
        const [id, fn] = timers.entries().next().value;
        timers.delete(id); fn();
      }
      assert.equal(timers.size, 0, 'style observer must settle instead of scheduling itself forever');
    },
    setEnabled(value) { storageListeners.forEach((fn) => fn({ enabledBySite: { newValue: value } }, 'local')); },
    setDark(value) { appearance.matches = value; appearanceListeners.forEach((fn) => fn()); },
    get appearanceListenerCount() { return appearanceListeners.length; }
  };
}

test('supported URLs exclude lookalikes, unrelated Google paths, HTTP and standalone helpers', () => {
  const h = harness();
  const detect = (url) => h.registry.detectProduct(new URL(url), { includeHelpers: false });
  assert.equal(detect('https://www.google.com/search?q=safari'), 'googleSearch');
  assert.equal(detect('https://docs.google.com/spreadsheets/d/test/edit'), 'sheets');
  for (const url of ['https://www.google.com/searching', 'https://docs.google.com/document/d/test', 'http://mail.google.com/', 'https://mail.google.com.example.org/', 'https://accounts.google.com/']) {
    assert.equal(detect(url), null, url);
  }
});

test('helper frames inherit only a known supported parent and never preload optimistically', () => {
  const h = harness('https://accounts.google.com/', { embedded: true, referrer: 'https://mail.google.com/' });
  const context = h.registry.detectContext();
  assert.equal(context.parentProduct, 'gmail');
  assert.equal(h.registry.isProductEnabled({}, 'googleHelper', context), true);
  assert.equal(h.registry.isProductEnabled({ gmail: false }, 'googleHelper', context), false);
  assert.equal(h.registry.shouldPreloadWithoutHint('googleHelper', context), false);
  assert.equal(h.registry.isProductEnabled({}, 'googleHelper', {}), false);
});

test('storage normalization retains boolean preferences and drops unknown or malformed values', () => {
  const h = harness();
  const settings = h.registry.normalizeEnabledBySite({ gmail: false, sheets: 'false', unexpected: true });
  assert.equal(settings.gmail, false);
  assert.equal(settings.sheets, true);
  assert.equal(Object.hasOwn(settings, 'unexpected'), false);
  assert.equal(h.registry.isProductEnabled({}, 'unknown'), false);
});

test('style maintenance settles, repairs removed styles, and restores order after page CSS arrives', () => {
  const h = harness();
  const manager = h.registry.createStyleManager(h.api, 'gmail');
  manager.observe(); manager.sync(true); h.flush();
  const settledMutations = h.mutations;
  manager.sync(true); h.flush();
  assert.equal(h.mutations, settledMutations, 'unchanged styles should not mutate the DOM');
  h.document.head.appendChild(h.document.createElement('style'));
  h.flush();
  assert.equal(h.document.head.children.at(-1).dataset.pavelSafariDarkModeFile, 'gmail.css');
  h.document.getElementById('pavel-safari-dark-mode-link-0').remove();
  h.flush();
  assert.ok(h.document.getElementById('pavel-safari-dark-mode-link-0'));
  manager.sync(false); h.flush();
  assert.equal(h.document.querySelectorAll().length, 0);
});

test('a disabled site stays disabled after light/dark appearance changes', () => {
  const h = harness();
  h.run('preload.js'); h.run('content.js');
  h.reads.shift()({ enabledBySite: { gmail: true } });
  assert.equal(h.appearanceListenerCount, 1);
  h.setEnabled({ gmail: false });
  h.setDark(false); h.setDark(true); h.flush();
  assert.equal(h.document.documentElement.dataset.sdmEnabled, 'false');
  assert.equal(h.document.querySelectorAll().length, 0);
  h.setEnabled({ gmail: true }); h.flush();
  assert.equal(h.document.documentElement.dataset.sdmEnabled, 'true');
});

test('a delayed initial storage read cannot overwrite a more recent toggle', () => {
  const h = harness();
  h.run('preload.js'); h.run('content.js');
  h.setEnabled({ gmail: false });
  h.reads.shift()({ enabledBySite: { gmail: true } });
  assert.equal(h.document.documentElement.dataset.sdmEnabled, 'false');
});
