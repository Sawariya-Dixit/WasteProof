import test from 'node:test';
import assert from 'node:assert/strict';
import { basicAuth } from '../middleware/basicAuth.js';

const b64 = (s) => Buffer.from(s).toString('base64');

function run(header, user = 'ops', pass = 'long-password-123') {
  const res = {
    headers: {}, code: null,
    set(k, v) { this.headers[k] = v; return this; },
    status(c) { this.code = c; return this; },
    send() { return this; },
  };
  let nexted = false;
  basicAuth(user, pass)({ headers: { authorization: header } }, res, () => { nexted = true; });
  return { res, nexted };
}

test('sahi user/pass', () => assert.equal(run(`Basic ${b64('ops:long-password-123')}`).nexted, true));
test('galat password 401 + WWW-Authenticate', () => {
  const { res, nexted } = run(`Basic ${b64('ops:wrong')}`);
  assert.equal(nexted, false);
  assert.equal(res.code, 401);
  assert.match(res.headers['WWW-Authenticate'], /Basic/);
});
test('galat user 401', () => assert.equal(run(`Basic ${b64('admin:long-password-123')}`).res.code, 401));
test('header nahi 401', () => assert.equal(run(undefined).res.code, 401));
test('Bearer scheme 401', () => assert.equal(run('Bearer abc').res.code, 401));
test('password me colon', () => assert.equal(run(`Basic ${b64('ops:a:b:c-long-pass')}`, 'ops', 'a:b:c-long-pass').nexted, true));
