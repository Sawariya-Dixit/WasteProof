// Use: node scripts/testDecision.js   (DB/AWS/Groq nahi chahiye, sirf logic check)
import assert from 'node:assert/strict';
import { decide } from '../ai/decision.js';
import { judgeFromLabels } from '../ai/visionJudge.js';
import { normalizeLlmJudge } from '../ai/groqPrompt.js';
import { evaluate, tuneThresholds } from '../ai/judgeEval.js';
import { dHashFromGray, hammingHex } from '../utils/phash.js';

const J = (verdict) => ({ verdict });
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log(`ok  ${name}`);
};

// ---- decide()
ok('dono yes -> passed', () => assert.equal(decide({ labels: J('yes'), llm: J('yes') }).status, 'passed'));
ok('dono no -> rejected', () => {
  const d = decide({ labels: J('no'), llm: J('no') });
  assert.equal(d.status, 'rejected');
  assert.equal(d.reason, 'no_waste_detected');
});
ok('labels yes + llm uncertain -> reporter confirm', () =>
  assert.equal(decide({ labels: J('yes'), llm: J('uncertain') }).status, 'needs_reporter_confirm'));
ok('labels yes + llm no (raay alag) -> reject nahi, confirm', () =>
  assert.equal(decide({ labels: J('yes'), llm: J('no') }).status, 'needs_reporter_confirm'));
ok('labels no + llm yes -> confirm', () =>
  assert.equal(decide({ labels: J('no'), llm: J('yes') }).status, 'needs_reporter_confirm'));
ok('labels no + llm uncertain (kisi ne yes nahi, p<0.5) -> rejected', () =>
  assert.equal(decide({ labels: J('no'), llm: J('uncertain') }).status, 'rejected'));
ok('sirf labels: yes -> passed', () => assert.equal(decide({ labels: J('yes') }).status, 'passed'));
ok('sirf labels: uncertain (p=0.5) -> confirm', () =>
  assert.equal(decide({ labels: J('uncertain') }).status, 'needs_reporter_confirm'));
ok('sirf llm: no -> rejected', () => assert.equal(decide({ llm: J('no') }).status, 'rejected'));
ok('koi judge nahi -> no_judge', () => assert.equal(decide({}).status, 'no_judge'));
ok('detector pakka + clear no -> community_check', () =>
  assert.equal(decide({ labels: J('no'), llm: J('no'), detectorScore: 0.8 }).status, 'community_check'));
ok('probability: yes+yes = 0.9', () => assert.equal(decide({ labels: J('yes'), llm: J('yes') }).probability, 0.9));

// ---- labels judge (Day 10) abhi bhi waisa hi
ok('Garbage 90 -> waste_dump yes', () =>
  assert.equal(judgeFromLabels([{ name: 'Garbage', conf: 90 }], 'waste_dump').verdict, 'yes'));
ok('koi label nahi -> no', () => assert.equal(judgeFromLabels([], 'waste_dump').verdict, 'no'));

// ---- Groq jawab saaf karna
ok('galat/ajeeb jawab -> uncertain, kabhi yes nahi', () => {
  const r = normalizeLlmJudge({ garbage: 'maybe', usable_photo: 7 }, 'waste_dump');
  assert.equal(r.verdict, 'uncertain');
});
ok('usable_photo=no ho to yes bhi uncertain', () =>
  assert.equal(normalizeLlmJudge({ garbage: 'yes', usable_photo: 'no' }, 'waste_dump').verdict, 'uncertain'));
ok('overflowing_bin type overflowing dekhta hai', () => {
  assert.equal(normalizeLlmJudge({ overflowing: 'yes', garbage: 'yes', bin: 'yes' }, 'overflowing_bin').verdict, 'yes');
  assert.equal(normalizeLlmJudge({ overflowing: 'no', bin: 'yes', garbage: 'no' }, 'overflowing_bin').verdict, 'no');
});
ok('contaminated_water -> water', () =>
  assert.equal(normalizeLlmJudge({ water: 'yes', usable_photo: 'yes' }, 'contaminated_water').verdict, 'yes'));

// ---- pHash
ok('same photo hash distance 0', () => {
  const g = Uint8Array.from({ length: 72 }, (_, i) => (i * 37) % 251);
  assert.equal(hammingHex(dHashFromGray(g), dHashFromGray(g)), 0);
});
ok('ulti gradient ka distance bada', () => {
  const up = Uint8Array.from({ length: 72 }, (_, i) => i % 9);
  const down = Uint8Array.from({ length: 72 }, (_, i) => 8 - (i % 9));
  assert.ok(hammingHex(dHashFromGray(up), dHashFromGray(down)) > 50);
});
ok('hash 16 hex chars', () => assert.equal(dHashFromGray(new Uint8Array(72)).length, 16));

// ---- eval + tuning
const items = [
  { file: 'w1.jpg', expected: 'waste', type: 'waste_dump', labels: [{ name: 'Garbage', conf: 95 }] },
  { file: 'w2.jpg', expected: 'waste', type: 'waste_dump', labels: [{ name: 'Garbage', conf: 62 }] },
  { file: 'c1.jpg', expected: 'clean', type: 'waste_dump', labels: [{ name: 'Road', conf: 99 }] },
  { file: 'c2.jpg', expected: 'clean', type: 'waste_dump', labels: [{ name: 'Litter', conf: 72 }] },
];
ok('evaluate: false accept/reject ginta hai', () => {
  const r = evaluate(items, { useLlm: false });
  assert.equal(r.total, 4);
  assert.equal(r.falseAccepts, 1); // c2 pass ho gayi
  assert.equal(r.falseRejects, 0);
});
ok('tuneThresholds JUDGE ko wapas pehle jaisa chhodta hai', async () => {
  const { JUDGE } = await import('../config/defaults.js');
  const before = JUDGE.strongConf;
  const res = tuneThresholds(items);
  assert.ok(res.length > 0);
  assert.equal(JUDGE.strongConf, before);
  assert.ok(res[0].score <= res[res.length - 1].score);
});

console.log(`\n${n} checks pass`);
