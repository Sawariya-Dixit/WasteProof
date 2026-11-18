import test from 'node:test';
import assert from 'node:assert/strict';
import { dHashFromGray, hammingHex } from '../utils/phash.js';

test('hammingHex: 0, 1 aur 64', () => {
  assert.equal(hammingHex('ffff0000ffff0000', 'ffff0000ffff0000'), 0);
  assert.equal(hammingHex('0000000000000000', '0000000000000001'), 1);
  assert.equal(hammingHex('0000000000000000', 'ffffffffffffffff'), 64);
});

test('hammingHex: lambai alag ya khaali to 64 (duplicate nahi maana jata)', () => {
  assert.equal(hammingHex('00', '0000'), 64);
  assert.equal(hammingHex('', 'ff'), 64);
});

test('dHashFromGray: flat image = sab zero', () => {
  assert.equal(dHashFromGray(new Uint8Array(72).fill(128)), '0000000000000000');
});

test('dHashFromGray: har row left>right = sab bit 1', () => {
  const g = new Uint8Array(72);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) g[r * 9 + c] = 200 - c * 10;
  assert.equal(dHashFromGray(g), 'ffffffffffffffff');
});

test('dHashFromGray: galat size par error', () => {
  assert.throws(() => dHashFromGray(new Uint8Array(10)));
});
