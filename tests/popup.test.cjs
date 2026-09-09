const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('popup saves three modes, migrates legacy preferences and restores selection on save failure', () => {
  let stored = { gmail: true, sheets: false };
  let failSave = false;
  const elements = Object.fromEntries(['site-label', 'appearance-mode', 'appearance-status', 'unsupported', 'retry-connection'].map(id =>
    [id, { disabled: true, addEventListener(_type, callback) { this.change = callback; } }]));
  const doc = { getElementById: id => elements[id], body: {} };
  doc.activeElement = doc.body;
  const choices = ['dark', 'off', 'system'].map(value => ({ value, checked: false, focus() { doc.activeElement = this; } }));
  let disabled = true;
  Object.defineProperty(elements['appearance-mode'], 'disabled', { get: () => disabled, set(value) { disabled = value; if (value && choices.includes(doc.activeElement)) doc.activeElement = doc.body; } });
  elements['appearance-mode'].querySelectorAll = () => choices;
  const select = mode => {
    for (const choice of choices) choice.checked = choice.value === mode;
    const choice = choices.find(choice => choice.checked);
    choice.focus();
    elements['appearance-mode'].change({ target: choice });
    assert.equal(doc.activeElement, choice, 'keep radio focused after success or failure');
  };
  const selectedMode = () => choices.filter(choice => choice.checked).map(choice => choice.value);
  const appearance = { matches: false, addEventListener(_type, callback) { this.change = callback; } };
  const api = {
    runtime: {},
    tabs: {
      query(_options, callback) { callback([{ id: 1, url: 'https://mail.google.com/' }]); },
      sendMessage(_id, _message, _options, callback) { callback({ product: 'gmail', mode: 'system' }); }
    },
    storage: { local: {
      get(_defaults, callback) { callback({ enabledBySite: stored }); },
      set(items, callback) {
        if (failSave) api.runtime.lastError = new Error('Save failed');
        else stored = items.enabledBySite;
        callback();
        delete api.runtime.lastError;
      }
    } }
  };
  const context = vm.createContext({ URL, setTimeout, clearTimeout, browser: api, document: doc, matchMedia: () => appearance });
  for (const file of ['site-registry.js', 'popup/popup.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension', file), 'utf8'), context);
  }
  const selector = elements['appearance-mode'];
  const status = elements['appearance-status'];
  assert.deepEqual(selectedMode(), ['system']);
  assert.equal(selector.disabled, false);
  assert.match(status.textContent, /original appearance/);
  for (const mode of ['dark', 'off', 'system']) {
    select(mode);
    assert.deepEqual(selectedMode(), [mode]);
    assert.equal(stored.gmail, mode);
    assert.equal(stored.sheets, 'off', 'preserve other sites when migrating storage');
    assert.equal(selector.disabled, false);
  }
  appearance.matches = true; appearance.change();
  assert.match(status.textContent, /Following your device: dark/);
  failSave = true; select('dark');
  assert.equal(stored.gmail, 'system');
  assert.deepEqual(selectedMode(), ['system']);
  assert.equal(selector.disabled, false);
  assert.match(status.textContent, /Couldn’t save/);
});

test('popup times out stalled APIs, retries, and ignores stale responses', () => {
  for (const stall of ['query', 'message', 'throw']) {
    const elements = Object.fromEntries(['site-label', 'appearance-mode', 'appearance-status', 'unsupported', 'retry-connection'].map(id =>
      [id, { addEventListener(type, callback) { this[type] = callback; } }]));
    const choices = ['dark', 'off', 'system'].map(value => ({ value }));
    elements['appearance-mode'].querySelectorAll = () => choices;
    const timers = new Map(); let nextTimer = 0, healthy = false, late;
    const response = { product: 'gmail', mode: 'dark' };
    const api = { runtime: {}, tabs: {
      query(_options, callback) {
        if (!healthy && stall === 'throw') throw new Error('Extension context invalid');
        if (!healthy && stall === 'query') { late = () => callback([{id: 1, url: 'https://mail.google.com/'}]); return; }
        callback([{ id: 1, url: 'https://mail.google.com/' }]);
      },
      sendMessage(_id, _message, _options, callback) {
        if (!healthy) { late = () => callback({product: 'sheets', mode: 'off'}); return; }
        callback(response);
      }
    } };
    const context = vm.createContext({ URL, browser: api,
      setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
      clearTimeout(id) { timers.delete(id); },
      document: { getElementById: id => elements[id] },
      matchMedia: () => ({ matches: true, addEventListener() {} })
    });
    for (const file of ['site-registry.js', 'popup/popup.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension', file), 'utf8'), context);
    for (const callback of [...timers.values()]) callback();
    assert.equal(elements['appearance-mode'].disabled, true);
    assert.equal(elements['retry-connection'].hidden, false);
    assert.doesNotMatch(elements['appearance-status'].textContent, /Connecting/);
    healthy = true; elements['retry-connection'].click();
    assert.equal(elements['appearance-mode'].disabled, false);
    assert.equal(elements['retry-connection'].hidden, true);
    late?.();
    assert.equal(elements['site-label'].textContent, 'Gmail');
    assert.equal(choices.find(choice => choice.checked).value, 'dark');
    assert.equal(timers.size, 0);
  }
});
