const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { authSettings, createTokenVerifier, authentication, requireRole } = require('./auth');

function createApp({ pool, verifyToken, env = process.env, fetchImpl = fetch }) {
  const app = express();
  app.disable('x-powered-by');
  const origins = (env.CORS_ORIGINS || 'http://localhost:8081').split(',').map(x => x.trim());
  app.use(cors({ origin: (origin, done) => done(null, !origin || origins.includes(origin)),
    allowedHeaders: ['Authorization', 'Content-Type'], methods: ['GET', 'POST', 'PATCH'] }));
  app.use(express.json({ limit: '16kb' }));
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', authentication(verifyToken, pool));
  app.get('/api/auth/me', (req, res) => {
    const a = req.account;
    res.json({ name: a.display_name, email: a.email, role: a.role,
      student: a.student_id || null, sisId: a.sis_id || null, method: 'microsoft' });
  });
  const localOnly = (_req, res, next) => env.ATTENDANCE_MODE === 'local'
    ? next() : res.status(503).json({ error: 'Attendance integration is not configured. The local prototype is disabled.' });
  const ownsUnit = async (account, unit) => (await pool.query(
    'SELECT 1 FROM lecturer_units WHERE tenant_id = $1 AND microsoft_oid = $2 AND unit_code = $3',
    [account.tenant_id, account.microsoft_oid, unit])).rowCount > 0;
  app.get('/api/units', requireRole('lecturer'), localOnly, async (req, res) => {
    const result = await pool.query(`SELECT u.code, u.name FROM units u JOIN lecturer_units l ON l.unit_code = u.code
      WHERE l.tenant_id = $1 AND l.microsoft_oid = $2 ORDER BY u.code`, [req.account.tenant_id, req.account.microsoft_oid]);
    res.json(result.rows);
  });
  app.get('/api/attendance/me', requireRole('student'), localOnly, async (req, res) => {
    const result = await pool.query(`SELECT u.code, u.name, su.attendance FROM student_units su
      JOIN units u ON u.code = su.unit_code WHERE su.student_id = $1 ORDER BY u.code`, [req.account.student_id]);
    res.json({ source: 'Local prototype database', student: { name: req.account.display_name, sis_id: req.account.sis_id },
      units: result.rows.map(u => ({ ...u, attendance: u.attendance == null ? null : Number(u.attendance) })) });
  });
  app.post('/api/sessions/create', requireRole('lecturer'), localOnly, async (req, res) => {
    const { unit_code, duration_minutes } = req.body || {};
    if (typeof unit_code !== 'string' || ![5, 10, 15, 30].includes(duration_minutes)) return res.status(400).json({ error: 'Select a unit and a supported duration.' });
    if (!await ownsUnit(req.account, unit_code)) return res.status(403).json({ error: 'You are not assigned to this unit.' });
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + duration_minutes * 60000);
    const { rows } = await pool.query(`INSERT INTO attendance_sessions (id, unit_code, session_token, expires_at, tenant_id, lecturer_oid)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, session_token, expires_at`,
      [crypto.randomUUID(), unit_code, token, expires, req.account.tenant_id, req.account.microsoft_oid]);
    res.status(201).json(rows[0]);
  });
  app.post('/api/sessions/scan', requireRole('student'), localOnly, async (req, res) => {
    const { session_token } = req.body || {};
    if (typeof session_token !== 'string' || !/^[0-9a-f]{64}$/.test(session_token)) return res.status(400).json({ error: 'Invalid attendance QR code.' });
    // Identity comes only from the verified account, never a student_id supplied by the client.
    const result = await pool.query(`INSERT INTO attendance_scans (session_id, student_id, status)
      SELECT s.id, $2, 'Present' FROM attendance_sessions s
      JOIN student_units su ON su.unit_code = s.unit_code AND su.student_id = $2
      WHERE s.session_token = $1 AND s.expires_at > NOW() AND s.tenant_id = $3
      ON CONFLICT (session_id, student_id) DO NOTHING RETURNING session_id`,
      [session_token, req.account.student_id, req.account.tenant_id]);
    if (!result.rowCount) return res.status(409).json({ error: 'This session is expired, already recorded, or not available for your enrolled units.' });
    res.json({ message: 'Attendance recorded in the local prototype.' });
  });
  app.get('/api/sessions/:id/roster', requireRole('lecturer'), localOnly, async (req, res) => {
    const session = (await pool.query('SELECT unit_code FROM attendance_sessions WHERE id = $1 AND tenant_id = $2', [req.params.id, req.account.tenant_id])).rows[0];
    if (!session || !await ownsUnit(req.account, session.unit_code)) return res.status(403).json({ error: 'This class is not assigned to you.' });
    const { rows } = await pool.query(`SELECT st.id, st.name, st.sis_id, COALESCE(sc.status, 'Absent') AS status
      FROM student_units su JOIN students st ON st.id = su.student_id
      LEFT JOIN attendance_scans sc ON sc.student_id = st.id AND sc.session_id = $1
      WHERE su.unit_code = $2 ORDER BY st.name`, [req.params.id, session.unit_code]);
    res.json(rows);
  });
  app.patch('/api/sessions/:id/attendance', requireRole('lecturer'), localOnly, async (req, res) => {
    const { student_id, status } = req.body || {};
    if (typeof student_id !== 'string' || !['Present', 'Late', 'Absent', 'Excused'].includes(status)) return res.status(400).json({ error: 'Select a student and a valid attendance status.' });
    const session = (await pool.query('SELECT unit_code FROM attendance_sessions WHERE id = $1 AND tenant_id = $2', [req.params.id, req.account.tenant_id])).rows[0];
    if (!session || !await ownsUnit(req.account, session.unit_code)) return res.status(403).json({ error: 'This class is not assigned to you.' });
    const result = await pool.query(`INSERT INTO attendance_scans (session_id, student_id, status)
      SELECT $1, student_id, $3 FROM student_units WHERE student_id = $2 AND unit_code = $4
      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status RETURNING student_id`,
      [req.params.id, student_id, status, session.unit_code]);
    if (!result.rowCount) return res.status(404).json({ error: 'The student is not enrolled in this unit.' });
    res.json({ message: 'Attendance updated in the local prototype.' });
  });
  async function report(req, res, kind) {
    const configured = kind === 'visa' ? env.N8N_VISA_REPORT_URL : env.N8N_CLASS_EXPORT_URL;
    if (!configured || !env.N8N_API_KEY) return res.status(503).json({ error: 'The reporting workflow is not configured.' });
    const url = new URL(configured);
    if (env.NODE_ENV === 'production' && url.protocol !== 'https:') return res.status(503).json({ error: 'Reporting requires an HTTPS upstream.' });
    if (kind === 'visa') url.searchParams.set('sis_id', req.account.sis_id);
    else {
      const unit = req.query.unit_code;
      if (typeof unit !== 'string' || !await ownsUnit(req.account, unit)) return res.status(403).json({ error: 'Select a class assigned to you.' });
      const mapping = (await pool.query('SELECT qwickly_course_id FROM units WHERE code = $1', [unit])).rows[0];
      if (!mapping?.qwickly_course_id) return res.status(503).json({ error: 'This unit has no Qwickly course mapping.' });
      url.searchParams.set('course_id', mapping.qwickly_course_id);
    }
    let upstream;
    try {
      upstream = await fetchImpl(url, { headers: { Authorization: `Bearer ${env.N8N_API_KEY}` }, redirect: 'error', signal: AbortSignal.timeout(15000) });
    } catch { return res.status(502).json({ error: 'The reporting workflow could not be reached.' }); }
    const mime = kind === 'visa' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!upstream.ok || !upstream.headers.get('content-type')?.includes(mime)) return res.status(502).json({ error: 'The reporting workflow did not return a valid report.' });
    const filename = kind === 'visa' ? 'visa-compliance.pdf' : 'class-attendance.xlsx';
    // Limit report size; do not forward upstream headers or credentials.
    const chunks = []; let size = 0;
    try {
      for await (const chunk of upstream.body) {
        size += chunk.length;
        if (size > 20 * 1024 * 1024) throw new Error('Report too large');
        chunks.push(chunk);
      }
    } catch { return res.status(502).json({ error: 'The report could not be downloaded.' }); }
    res.set({ 'Content-Type': mime, 'Content-Disposition': `attachment; filename="${filename}"` });
    res.send(Buffer.concat(chunks));
  }
  app.get('/api/reports/visa', requireRole('student'), (req, res) => report(req, res, 'visa'));
  app.get('/api/reports/class', requireRole('lecturer'), (req, res) => report(req, res, 'class'));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    // Do not log tokens, connection strings, student records or upstream responses.
    console.error('Attendance API request failed:', error.code || error.name || 'Error');
    res.status(503).json({ error: 'The attendance service is unavailable. Check server configuration and database setup.' });
  });
  return app;
}
async function start() {
  require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
  const settings = authSettings(process.env);
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL in the server .env file.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, query_timeout: 10000 });
  const verifyToken = await createTokenVerifier(settings);
  const app = createApp({ pool, verifyToken });
  const server = app.listen(Number(process.env.PORT || 6522), '0.0.0.0', () => console.log('Attendance API listening on configured port.'));
  const close = () => server.close(() => { void pool.end(); });
  process.on('SIGTERM', close); process.on('SIGINT', close);
}
if (require.main === module) start().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { createApp };
