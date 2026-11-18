import './setupEnv.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { buildScore } = await import('../services/scoreService.js');

const base = { verified: 10, total: 12, behaviourVerified: 0, noBinVerified: 0, binOnTime: 0, binLate: 0, repeatSites: 0 };
const c = (over = {}) => ({ ...base, ...over });

test('10 se kam verified: score chhupa, diagnosis/insights khaali', () => {
  const s = buildScore(c({ verified: 9 }), 100);
  assert.equal(s.visible, false);
  assert.equal(s.diagnosis, null);
  assert.deepEqual(s.insights, []);
});

test('10 verified: score dikhta hai', () => {
  assert.equal(buildScore(c({ verified: 10 }), 100).visible, true);
});

test('city score: 3 on-time, 1 late = 75', () => {
  assert.equal(buildScore(c({ binOnTime: 3, binLate: 1 }), 100).cityScore, 75);
});

test('city score: 3 se kam eligible bins par null', () => {
  assert.equal(buildScore(c({ binOnTime: 1, binLate: 1 }), 100).cityScore, null);
});

test('density score: 0 sites = 100, bad density par 0, aadha = 50', () => {
  assert.equal(buildScore(c({ behaviourVerified: 0 }), 100).citizenScore, 100);
  assert.equal(buildScore(c({ behaviourVerified: 1 }), 100).citizenScore, 0); // 0.01/km2 = badDensity
  assert.equal(buildScore(c({ behaviourVerified: 1 }), 200).citizenScore, 50);
});

test('area size nahi pata to density scores null (history invent nahi)', () => {
  const s = buildScore(c(), undefined);
  assert.equal(s.citizenScore, null);
  assert.equal(s.binScore, null);
});

test('diagnosis: infrastructure_gap, city_response, repeat_spot, behaviour, balanced', () => {
  assert.equal(buildScore(c({ noBinVerified: 1 }), 100).diagnosis, 'infrastructure_gap');
  assert.equal(buildScore(c({ binOnTime: 1, binLate: 3 }), 100).diagnosis, 'city_response');
  assert.equal(buildScore(c({ repeatSites: 4 }), 100).diagnosis, 'repeat_spot');
  assert.equal(buildScore(c({ behaviourVerified: 1 }), 100).diagnosis, 'behaviour');
  assert.equal(buildScore(c({ binOnTime: 3 }), 100).diagnosis, 'balanced');
});

test('overallScore: available scores ka average', () => {
  // city 100 (3/3), citizen 100, bin 100
  assert.equal(buildScore(c({ binOnTime: 3 }), 100).overallScore, 100);
});
