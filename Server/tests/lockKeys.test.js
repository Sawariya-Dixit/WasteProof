import './setupEnv.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { lockKeys } = await import('../services/siteMergeService.js');

test('3x3 = 9 unique, sorted keys (deadlock nahi)', () => {
  const k = lockKeys('waste_dump', 22.5933, 76.9132);
  assert.equal(k.length, 9);
  assert.equal(new Set(k).size, 9);
  assert.deepEqual(k, [...k].sort());
});

test('paas ki do reports ke cells overlap karte hain (ek hi site banegi)', () => {
  const a = new Set(lockKeys('waste_dump', 22.5933, 76.9132));
  const b = lockKeys('waste_dump', 22.5934, 76.9133);
  assert.ok(b.some((x) => a.has(x)));
});

test('alag type ke lock alag', () => {
  const a = new Set(lockKeys('waste_dump', 22.5933, 76.9132));
  assert.ok(!lockKeys('no_bin', 22.5933, 76.9132).some((x) => a.has(x)));
});
