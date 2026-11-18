import test from 'node:test';
import assert from 'node:assert/strict';
import { inIndia, distanceM } from '../utils/geo.js';

test('inIndia: andar aur bahar', () => {
  assert.equal(inIndia(22.5933, 76.9132), true); // Khategaon
  assert.equal(inIndia(28.6, 77.2), true); // Delhi
  assert.equal(inIndia(0, 0), false);
  assert.equal(inIndia(51.5, -0.1), false); // London
});

test('distanceM: same point 0', () => {
  assert.equal(distanceM([76.9132, 22.5933], [76.9132, 22.5933]), 0);
});

test('distanceM: 0.001 degree latitude ~ 111 m', () => {
  const d = distanceM([76.9132, 22.5933], [76.9132, 22.5943]);
  assert.ok(Math.abs(d - 111.2) < 1.5, `got ${d}`);
});

test('distanceM: symmetric', () => {
  const a = [76.9132, 22.5933];
  const b = [77.2, 28.6];
  assert.equal(Math.round(distanceM(a, b)), Math.round(distanceM(b, a)));
});
