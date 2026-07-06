const crypto = require('crypto');

const SECRET = process.env.ADMIN_SESSION_SECRET;
const COOKIE_NAME = 'ecotrack_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

if (!SECRET) {
  console.warn('ADMIN_SESSION_SECRET is not set — admin auth will not work.');
}

function sign(payload) {
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

function createSessionToken() {
  const expires = Date.now() + SESSION_TTL_MS;
  return sign(String(expires));
}

function verifySessionToken(token) {
  if (!token || !token.includes('.')) return false;
  const [payload, hmac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const valid =
    hmac.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
  if (!valid) return false;
  return Number(payload) > Date.now();
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf('=');
        return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
      })
  );
}

function requireAdmin(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!verifySessionToken(token)) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}

module.exports = { COOKIE_NAME, createSessionToken, verifySessionToken, requireAdmin };
