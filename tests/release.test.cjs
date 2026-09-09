const test = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../extension/manifest.json');

test('Safari App Store manifest description satisfies the upload limit', () => {
  // App Store Connect error 90849 rejects descriptions longer than 112 characters.
  assert.equal(typeof manifest.description, 'string');
  assert.ok(manifest.description.length > 0);
  assert.ok(manifest.description.length <= 112);
});
