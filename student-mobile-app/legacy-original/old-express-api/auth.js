const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function authSettings(env) {
  if (!GUID.test(env.MS_TENANT_ID || '') || !GUID.test(env.MS_API_AUDIENCE || '') || !GUID.test(env.MS_CLIENT_ID || '')) {
    throw new Error('Configure MS_TENANT_ID, MS_API_AUDIENCE and MS_CLIENT_ID as application/tenant GUIDs.');
  }
  return { tenant: env.MS_TENANT_ID, audience: env.MS_API_AUDIENCE, client: env.MS_CLIENT_ID,
    scope: env.MS_REQUIRED_SCOPE || 'access_as_user', issuer: `https://login.microsoftonline.com/${env.MS_TENANT_ID}/v2.0` };
}
async function createTokenVerifier(settings, testKey) {
  const { jwtVerify, createRemoteJWKSet } = await import('jose');
  const key = testKey || createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${settings.tenant}/discovery/v2.0/keys`), { timeoutDuration: 10000 });
  return async token => {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['RS256'], issuer: settings.issuer, audience: settings.audience,
      requiredClaims: ['exp', 'iat', 'nbf', 'tid', 'oid', 'azp', 'scp'], clockTolerance: 5,
    });
    if (payload.ver !== '2.0' || payload.tid !== settings.tenant || payload.azp !== settings.client || !GUID.test(payload.oid || '')) {
      throw new Error('Invalid token identity.');
    }
    if (typeof payload.scp !== 'string' || !payload.scp.split(' ').includes(settings.scope)) throw new Error('Required API scope is missing.');
    return payload;
  };
}
function authentication(verify, pool) {
  return async (req, res, next) => {
    const match = /^Bearer ([^ ]+)$/.exec(req.headers.authorization || '');
    if (!match || match[1].length > 16384) return res.status(401).json({ error: 'Sign in with Microsoft to continue.' });
    let claims;
    try { claims = await verify(match[1]); }
    catch { return res.status(401).json({ error: 'Your Microsoft session is invalid or expired. Please sign in again.' }); }
    try {
      const { rows } = await pool.query(
        `SELECT a.tenant_id, a.microsoft_oid, a.role, a.display_name, a.email, a.student_id, s.sis_id
         FROM auth_accounts a LEFT JOIN students s ON s.id = a.student_id
         WHERE a.tenant_id = $1 AND a.microsoft_oid = $2 AND a.active = true`, [claims.tid, claims.oid]);
      const account = rows[0];
      if (!account || !['student', 'lecturer'].includes(account.role) ||
        (account.role === 'student' && (!account.student_id || !account.sis_id))) {
        return res.status(403).json({ error: 'Your university account has not been provisioned with a role and student record. Contact the administrator.' });
      }
      req.account = account;
      next();
    } catch (error) { next(error); }
  };
}
const requireRole = role => (req, res, next) => req.account.role === role ? next() : res.status(403).json({ error: 'This action is not available for your role.' });
module.exports = { authSettings, createTokenVerifier, authentication, requireRole };
