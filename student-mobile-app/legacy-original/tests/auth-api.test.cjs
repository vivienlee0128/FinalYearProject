const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/attendance-api/server');
const { authSettings, createTokenVerifier } = require('../src/attendance-api/auth');
let SignJWT, privateKey, verifyToken;
const tenant = '11111111-1111-4111-8111-111111111111';
const client = '22222222-2222-4222-8222-222222222222';
const audience = '33333333-3333-4333-8333-333333333333';
const oid = '44444444-4444-4444-8444-444444444444';
const env = { MS_TENANT_ID: tenant, MS_CLIENT_ID: client, MS_API_AUDIENCE: audience, ATTENDANCE_MODE: 'local' };
before(async () => {
  const jose = await import('../src/attendance-api/node_modules/jose/dist/webapi/index.js');
  SignJWT = jose.SignJWT;
  const keys = await jose.generateKeyPair('RS256');
  privateKey = keys.privateKey;
  verifyToken = await createTokenVerifier(authSettings(env), keys.publicKey);
});
async function token(overrides = {}, signingKey = privateKey) {
  return new SignJWT({ ver: '2.0', tid: tenant, oid, azp: client, scp: 'access_as_user', ...overrides })
    .setProtectedHeader({ alg: 'RS256' }).setIssuer(`https://login.microsoftonline.com/${tenant}/v2.0`)
    .setAudience(audience).setIssuedAt().setNotBefore('0s').setExpirationTime('5m').sign(signingKey);
}
const account = { tenant_id: tenant, microsoft_oid: oid, role: 'student', display_name: 'Test Student', email: 'student@example.invalid', student_id: 'internal-1', sis_id: 'sis-1' };
async function serve(t, overrides = {}) {
  const queries = [];
  const pool = { query: async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes('FROM auth_accounts')) return { rows: overrides.account === null ? [] : [overrides.account || account], rowCount: 1 };
    return overrides.query ? overrides.query(sql, params) : { rows: [], rowCount: 0 };
  } };
  const app = createApp({ pool, verifyToken, env: { ...env, ...overrides.env }, fetchImpl: overrides.fetchImpl });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return { queries, call: (path, options = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, options) };
}
test('API starts and health requires no credentials', async t => {
  const { call } = await serve(t); assert.equal((await call('/health')).status, 200);
});
test('missing and forged tokens never reach the account database', async t => {
  const { call, queries } = await serve(t);
  assert.equal((await call('/api/auth/me')).status, 401);
  assert.equal((await call('/api/auth/me', { headers: { Authorization: 'Bearer forged' } })).status, 401);
  assert.equal(queries.length, 0);
});
test('signed Microsoft API token resolves trusted role and separate student identifiers', async t => {
  const { call } = await serve(t);
  const response = await call('/api/auth/me', { headers: { Authorization: `Bearer ${await token()}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { name: account.display_name, email: account.email, role: 'student', student: 'internal-1', sisId: 'sis-1', method: 'microsoft' });
});
test('wrong tenant, client, scope and token version are rejected', async () => {
  for (const override of [{ tid: client }, { azp: tenant }, { scp: 'User.Read' }, { ver: '1.0' }, { oid: 'bad' }]) {
    await assert.rejects(() => token(override).then(verifyToken));
  }
});
test('wrong audience, issuer, expired token and invalid signature are rejected', async () => {
  for (const change of [jwt => jwt.setAudience(client), jwt => jwt.setIssuer('https://example.invalid'), jwt => jwt.setExpirationTime('1 second ago')]) {
    let jwt = new SignJWT({ tid: tenant, oid, azp: client, scp: 'access_as_user', ver: '2.0' })
      .setProtectedHeader({ alg: 'RS256' }).setIssuer(`https://login.microsoftonline.com/${tenant}/v2.0`).setAudience(audience)
      .setIssuedAt().setNotBefore('0s').setExpirationTime('5m');
    // Expiry is well beyond the deliberate five-second clock tolerance.
    if (change.toString().includes('Expiration')) jwt = jwt.setExpirationTime(Math.floor(Date.now()/1000)-60);
    else jwt = change(jwt);
    await assert.rejects(() => jwt.sign(privateKey).then(verifyToken));
  }
  const { generateKeyPair } = await import('../src/attendance-api/node_modules/jose/dist/webapi/index.js');
  const other = await generateKeyPair('RS256');
  await assert.rejects(() => token({}, other.privateKey).then(verifyToken));
});
test('unprovisioned and incomplete student accounts cannot sign in', async t => {
  for (const record of [null, { ...account, sis_id: null }]) {
    const { call } = await serve(t, { account: record });
    assert.equal((await call('/api/auth/me', { headers: { Authorization: `Bearer ${await token()}` } })).status, 403);
  }
});
test('student cannot create sessions or request lecturer exports', async t => {
  const { call } = await serve(t);
  const headers = { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' };
  assert.equal((await call('/api/sessions/create', { method: 'POST', headers, body: '{}' })).status, 403);
  assert.equal((await call('/api/reports/class?unit_code=TEST', { headers })).status, 403);
});
test('scan uses authenticated student, ignoring a forged student_id', async t => {
  const { call, queries } = await serve(t, { query: async () => ({ rowCount: 1, rows: [{ session_id: 'session-1' }] }) });
  const response = await call('/api/sessions/scan', { method: 'POST', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ session_token: 'a'.repeat(64), student_id: 'someone-else' }) });
  assert.equal(response.status, 200);
  assert.deepEqual(queries.at(-1).params, ['a'.repeat(64), 'internal-1', tenant]);
});
test('lecturer cannot create a session for an unassigned unit', async t => {
  const { call } = await serve(t, { account: { ...account, role: 'lecturer' } });
  const response = await call('/api/sessions/create', { method: 'POST', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ unit_code: 'TEST', duration_minutes: 15 }) });
  assert.equal(response.status, 403);
});
test('unconfigured attendance fails explicitly instead of generating demo data', async t => {
  const { call } = await serve(t, { env: { ATTENDANCE_MODE: 'disabled' } });
  assert.equal((await call('/api/attendance/me', { headers: { Authorization: `Bearer ${await token()}` } })).status, 503);
});
test('visa report uses mapped SIS ID and keeps workflow credentials server-side', async t => {
  let upstream;
  const { call } = await serve(t, { env: { N8N_VISA_REPORT_URL: 'https://workflow.example.invalid/visa', N8N_API_KEY: 'test-server-only-value' },
    fetchImpl: async (url, options) => { upstream = { url, options }; return new Response('%PDF-test', { headers: { 'Content-Type': 'application/pdf' } }); } });
  const response = await call('/api/reports/visa?sis_id=someone-else', { headers: { Authorization: `Bearer ${await token()}` } });
  assert.equal(response.status, 200); assert.equal(await response.text(), '%PDF-test');
  assert.equal(upstream.url.searchParams.get('sis_id'), 'sis-1');
  assert.equal(upstream.options.headers.Authorization, 'Bearer test-server-only-value');
  assert.equal(response.headers.get('authorization'), null);
});
