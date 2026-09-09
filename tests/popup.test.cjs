const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('popup saves three modes, migrates legacy preferences and restores selection on save failure', () => {
  let stored = { gmail: true, sheets: false };
  let failSave = false;
  const elements = Object.fromEntries(['site-label', 'appearance-mode', 'appearance-status', 'unsupported'].map(id =>
    [id, { disabled: true, addEventListener(_type, callback) { this.change = callback; } }]));
  const choices = ['dark', 'off', 'system'].map(value => ({ value, checked: false }));
  elements['appearance-mode'].querySelectorAll = () => choices;
  const select = mode => {
    for (const choice of choices) choice.checked = choice.value === mode;
    elements['appearance-mode'].change({ target: choices.find(choice => choice.checked) });
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
  const context = vm.createContext({ URL, browser: api, document: { getElementById: id => elements[id] }, matchMedia: () => appearance });
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
