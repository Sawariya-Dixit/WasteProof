import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanNoteText, findPii } from '../utils/pii.js';

test('saaf note me koi PII nahi', () => {
  assert.deepEqual(findPii('Kachra yahan 3 din se pada hai'), []);
});

test('phone: spaces/dash ke saath aur Hindi digits me bhi', () => {
  assert.ok(findPii('call 98765 43210').includes('phone'));
  assert.ok(findPii('98765-43210').includes('phone'));
  assert.ok(findPii('\u096F\u096E\u096D\u096C\u096B\u096A\u0969\u0968\u0967\u0966').includes('phone'));
});

test('email sirf email ginta hai, domain ko url nahi', () => {
  assert.deepEqual(findPii('mail a@b.com'), ['email']);
});

test('url, handle, number plate', () => {
  assert.ok(findPii('dekho www.kuch.in').includes('url'));
  assert.ok(findPii('mujhe @rahul_k se pata chala').includes('handle'));
  assert.ok(findPii('gaadi MP 09 AB 1234 thi').includes('plate'));
});

test('cleanNoteText: tags hatao, ek line banao', () => {
  assert.equal(cleanNoteText('<b>hi</b>\n  there'), 'hi there');
  assert.equal(cleanNoteText(null), '');
});
