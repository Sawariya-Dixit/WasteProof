import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../ai/decision.js';
import { judgeFromLabels } from '../ai/visionJudge.js';
import { normalizeLlmJudge } from '../ai/groqPrompt.js';

const J = (verdict) => ({ verdict });

test('dono yes -> passed, probability 0.9', () => {
  const d = decide({ labels: J('yes'), llm: J('yes') });
  assert.equal(d.status, 'passed');
  assert.equal(d.probability, 0.9);
});

test('dono no -> rejected', () => {
  const d = decide({ labels: J('no'), llm: J('no') });
  assert.equal(d.status, 'rejected');
  assert.equal(d.reason, 'no_waste_detected');
});

test('raay alag (labels yes, llm no) -> reject nahi, reporter confirm; p = 0.42', () => {
  const d = decide({ labels: J('yes'), llm: J('no') });
  assert.equal(d.status, 'needs_reporter_confirm');
  assert.equal(d.probability, 0.42);
});

test('labels no + llm yes -> confirm; p = 0.58', () => {
  const d = decide({ labels: J('no'), llm: J('yes') });
  assert.equal(d.status, 'needs_reporter_confirm');
  assert.equal(d.probability, 0.58);
});

test('kisi ne yes nahi bola aur p<0.5 -> rejected', () => {
  assert.equal(decide({ labels: J('no'), llm: J('uncertain') }).status, 'rejected');
});

test('dono uncertain (p=0.5, rejectBelow se kam nahi) -> confirm', () => {
  assert.equal(decide({ labels: J('uncertain'), llm: J('uncertain') }).status, 'needs_reporter_confirm');
});

test('sirf ek judge available ho to wahi chalta hai', () => {
  assert.equal(decide({ labels: J('yes') }).status, 'passed');
  assert.equal(decide({ llm: J('no') }).status, 'rejected');
});

test('koi judge nahi -> no_judge', () => {
  assert.equal(decide({}).status, 'no_judge');
  assert.equal(decide().status, 'no_judge');
});

test('detector pakka (>=0.5) + clear no -> community_check; 0.49 -> rejected', () => {
  assert.equal(decide({ labels: J('no'), llm: J('no'), detectorScore: 0.5 }).status, 'community_check');
  assert.equal(decide({ labels: J('no'), llm: J('no'), detectorScore: 0.49 }).status, 'rejected');
});

test('detector passed ko nahi badalta', () => {
  assert.equal(decide({ labels: J('yes'), llm: J('yes'), detectorScore: 0.9 }).status, 'passed');
});

test('model kabhi "verified" status nahi deta', () => {
  const allowed = new Set(['passed', 'rejected', 'community_check', 'needs_reporter_confirm', 'no_judge']);
  const v = ['yes', 'no', 'uncertain', undefined];
  for (const a of v) for (const b of v) {
    const s = decide({ labels: a && J(a), llm: b && J(b), detectorScore: 0.9 }).status;
    assert.ok(allowed.has(s), `unexpected status ${s}`);
  }
});

// ---- AI mock: judges ke kachche jawab se decision tak (Groq / Rekognition ke bina)
test('mock pipeline: Garbage label + LLM yes -> passed', () => {
  const labels = judgeFromLabels([{ name: 'Garbage', conf: 90 }], 'waste_dump');
  const llm = normalizeLlmJudge({ garbage: 'yes', usable_photo: 'yes' }, 'waste_dump');
  assert.equal(decide({ labels, llm }).status, 'passed');
});

test('mock pipeline: koi label nahi + LLM no -> rejected', () => {
  const labels = judgeFromLabels([], 'waste_dump');
  const llm = normalizeLlmJudge({ garbage: 'no', usable_photo: 'yes' }, 'waste_dump');
  assert.equal(decide({ labels, llm }).status, 'rejected');
});

test('mock pipeline: LLM ka ajeeb jawab kabhi pass nahi karwata', () => {
  const llm = normalizeLlmJudge({ garbage: 'maybe', usable_photo: 7 }, 'waste_dump');
  assert.equal(llm.verdict, 'uncertain');
  assert.notEqual(decide({ llm }).status, 'passed');
});

test('mock pipeline: usable_photo=no ho to garbage yes bhi pass nahi', () => {
  const llm = normalizeLlmJudge({ garbage: 'yes', usable_photo: 'no' }, 'waste_dump');
  assert.equal(llm.verdict, 'uncertain');
});
