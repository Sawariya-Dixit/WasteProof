import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractQuotes,
  verifyQuotes,
  verifyLetterProse,
  numbersIn,
  claimsVerified,
} from '../ai/quoteVerifier.js';

const clauses = [{ id: 'c1', text: 'The local body shall collect waste daily.' }];
const ctx = (over = {}) => ({ clauses, siteVerified: false, allowedNumbers: new Set([3, 10]), ...over });
const prose = (opening, request = 'Please arrange cleanup soon.') => ({ opening, request });

test('extractQuotes: straight aur curly dono', () => {
  assert.deepEqual(extractQuotes('a "x y" b \u201Cz w\u201D'), ['x y', 'z w']);
});

test('quote clause ka lagatar hissa ho to ok', () => {
  assert.equal(verifyQuotes('Rule: "shall collect waste"', clauses).ok, true);
});

test('shabd badle ya order badla to galat pakda jata hai', () => {
  assert.deepEqual(verifyQuotes('"shall collect waste hourly"', clauses).bad, ['shall collect waste hourly']);
  assert.equal(verifyQuotes('"waste collect shall"', clauses).ok, false);
});

test('shuru/aakhir ki punctuation ignore hoti hai', () => {
  assert.equal(verifyQuotes('"collect waste daily."', clauses).ok, true);
});

test('numbersIn Hindi digits ginta hai', () => {
  assert.deepEqual(numbersIn('१० लोग aur 3 din'), [10, 3]);
});

test('claimsVerified: English aur Hindi', () => {
  assert.equal(claimsVerified('This site is verified'), true);
  assert.equal(claimsVerified('यह साइट सत्यापित है'), true);
  assert.equal(claimsVerified('3 of 10 people have reported this'), false);
});

test('verifyLetterProse: saaf prose ok', () => {
  assert.equal(verifyLetterProse(prose('We write about a waste site near our ward.'), ctx()).ok, true);
});

test('verifyLetterProse: reasons', () => {
  const cases = [
    [prose(''), 'empty'],
    [prose('a'.repeat(901)), 'too_long'],
    [prose('See https://example.org now'), 'markup'],
    [prose('He said "hello'), 'unbalanced_quotes'],
    [prose('Rule says "shall collect waste hourly"'), 'quote_mismatch'],
    [prose('This site is verified by residents'), 'false_verified'],
    [prose('Seen 7 times this week'), 'invented_number'],
  ];
  for (const [p, reason] of cases) {
    const r = verifyLetterProse(p, ctx());
    assert.equal(r.ok, false, reason);
    assert.equal(r.reason, reason);
  }
});

test('verified site par "verified" likhna theek hai', () => {
  assert.equal(verifyLetterProse(prose('This site is verified by 10 residents'), ctx({ siteVerified: true })).ok, true);
});

test('clause na ho to kanoon ka zikr nahi chalta', () => {
  const r = verifyLetterProse(prose('Under the rules you must act'), ctx({ clauses: [] }));
  assert.equal(r.reason, 'invented_rule');
});

test('allowed Hindi number chalta hai', () => {
  assert.equal(verifyLetterProse(prose('१० लोगों ने बताया'), ctx()).ok, true);
});
