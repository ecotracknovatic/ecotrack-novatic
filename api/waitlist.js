const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { generateUniqueReferralCode, rewardUnlockedAt, referralLink } = require('../lib/referral');
const { sendWelcomeEmail, sendAdminNotification, sendReferralRewardEmail } = require('../lib/emails');
const { addToMailerLite } = require('../lib/mailerlite');

const SITE_URL = process.env.SITE_URL || 'https://ecotracknovatic.com';
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function logAttempt(ip, email, outcome) {
  try {
    await supabaseAdmin.from('submission_log').insert({ ip, email, outcome });
  } catch (e) {
    console.error('Failed to write submission_log:', e.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const body = req.body || {};

  // ---- 1. Honeypot ----
  // A hidden field named "website" that only bots fill in. Real users never
  // see or touch it. We return a fake-success response so the bot doesn't
  // learn it was blocked.
  if (body.website) {
    await logAttempt(ip, body.email, 'rejected_honeypot');
    return res.status(200).json({ success: true });
  }

  // ---- 2. Rate limiting ----
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count: recentAttempts, error: rlError } = await supabaseAdmin
    .from('submission_log')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart);

  if (!rlError && recentAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    await logAttempt(ip, body.email, 'rejected_rate_limit');
    return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' });
  }

  // ---- 3. Server-side validation ----
  const required = ['organization_name', 'contact_person', 'email', 'country', 'organization_type', 'expected_trees'];
  const missing = required.filter((f) => !body[f] || String(body[f]).trim() === '');
  if (missing.length) {
    await logAttempt(ip, body.email, 'rejected_invalid');
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
  }
  if (!EMAIL_RE.test(body.email)) {
    await logAttempt(ip, body.email, 'rejected_invalid');
    return res.status(400).json({ error: 'That email address doesn\u2019t look valid.' });
  }

  const email = String(body.email).trim().toLowerCase();

  // ---- 4. Duplicate check ----
  const { data: existing, error: dupError } = await supabaseAdmin
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (dupError) {
    console.error(dupError);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
  if (existing) {
    await logAttempt(ip, email, 'rejected_duplicate');
    return res.status(409).json({ error: 'This email is already on the waitlist.' });
  }

  // ---- 5. Referral code for the new signup ----
  const referralCode = await generateUniqueReferralCode(supabaseAdmin);

  // ---- 6. Resolve who referred them, if anyone ----
  let referredBy = null;
  if (body.ref) {
    const { data: referrer } = await supabaseAdmin
      .from('waitlist')
      .select('referral_code')
      .eq('referral_code', String(body.ref).trim())
      .maybeSingle();
    if (referrer) referredBy = referrer.referral_code;
  }

  // ---- 7. Insert the signup ----
  const insertPayload = {
    organization_name: body.organization_name,
    contact_person: body.contact_person,
    email,
    phone_number: body.phone_number || null,
    country: body.country,
    organization_type: body.organization_type,
    expected_trees: body.expected_trees,
    founding_partner: Boolean(body.founding_partner),
    source: referredBy ? 'referral' : 'landing_page',
    referral_code: referralCode,
    referred_by: referredBy,
    signup_ip: ip,
    user_agent: req.headers['user-agent'] || null,
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('waitlist')
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    console.error(insertError);
    await logAttempt(ip, email, 'rejected_invalid');
    return res.status(500).json({ error: 'Something went wrong saving your signup. Please try again.' });
  }

  await logAttempt(ip, email, 'accepted');

  const myReferralLink = referralLink(SITE_URL, referralCode);

  // ---- 8. Fire-and-forget side effects ----
  // These shouldn't block or fail the user's success response.
  const sideEffects = [
    sendWelcomeEmail({
      to: email,
      contactPerson: inserted.contact_person,
      waitlistPosition: inserted.waitlist_position,
      referralCode,
      referralLink: myReferralLink,
    }),
    sendAdminNotification({ payload: inserted }),
    addToMailerLite({
      email,
      fields: {
        name: inserted.contact_person,
        organization: inserted.organization_name,
        country: inserted.country,
      },
    }),
  ];

  // ---- 9. If this was a referral, bump the referrer's count + notify them ----
  if (referredBy) {
    sideEffects.push(
      (async () => {
        // Atomic increment via Postgres function — see supabase/schema.sql.
        const { data: updatedReferrer, error: refErr } = await supabaseAdmin
          .rpc('increment_referral_count', { p_referral_code: referredBy })
          .single();
        if (refErr || !updatedReferrer) return;

        const reward = rewardUnlockedAt(updatedReferrer.referral_count);
        return sendReferralRewardEmail({
          to: updatedReferrer.email,
          contactPerson: updatedReferrer.contact_person,
          referralCount: updatedReferrer.referral_count,
          rewardLabel: reward?.label || null,
        });
      })()
    );
  }

  await Promise.allSettled(sideEffects);

  return res.status(200).json({
    success: true,
    waitlistPosition: inserted.waitlist_position,
    referralCode,
    referralLink: myReferralLink,
  });
};
