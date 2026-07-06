const { createSessionToken, COOKIE_NAME } = require('../../lib/adminAuth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Admin login is not configured.' });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    // Same generic message either way — don't reveal whether the
    // password field even matched a real check.
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = createSessionToken();
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${12 * 60 * 60}`
  );
  return res.status(200).json({ success: true });
};
