const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM || 'EcoTrack Novatic <hello@ecotracknovatic.com>';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

const BRAND_GREEN = '#2E7D32';
const BRAND_SOFT = '#F5FBF6';

function emailShell(bodyHtml) {
  return `
  <div style="background:${BRAND_SOFT}; padding:32px 16px; font-family:Inter,Arial,sans-serif;">
    <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; border:1px solid #E7ECE8;">
      <div style="padding:28px 32px; border-bottom:1px solid #E7ECE8; display:flex; align-items:center; gap:10px;">
        <div style="font-family:Manrope,Arial,sans-serif; font-weight:800; font-size:17px; color:#1A1A1A;">
          🌱 EcoTrack <span style="color:${BRAND_GREEN};">Novatic</span>
        </div>
      </div>
      <div style="padding:32px;">
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px; background:${BRAND_SOFT}; text-align:center;">
        <p style="font-size:12.5px; color:#5B6660; margin:0;">Environmental Intelligence for a Sustainable Future.</p>
      </div>
    </div>
  </div>`;
}

async function sendWelcomeEmail({ to, contactPerson, waitlistPosition, referralCode, referralLink }) {
  const html = emailShell(`
    <h1 style="font-family:Manrope,Arial,sans-serif; font-size:22px; color:#1A1A1A; margin:0 0 14px;">Welcome, ${contactPerson} 👋</h1>
    <p style="font-size:15px; line-height:1.6; color:#333; margin:0 0 16px;">
      Thanks for joining. You're officially on the <strong>EcoTrack Novatic Early Access Waitlist</strong> —
      you're number <strong>#${waitlistPosition}</strong> in line.
    </p>
    <p style="font-size:15px; line-height:1.6; color:#333; margin:0 0 16px;">You'll be the first to hear about:</p>
    <ul style="font-size:14.5px; line-height:1.8; color:#333; padding-left:20px; margin:0 0 20px;">
      <li>Product updates</li>
      <li>Development progress</li>
      <li>Beta invitations</li>
      <li>MVP launch notification</li>
      <li>Exclusive announcements</li>
    </ul>
    <div style="background:${BRAND_SOFT}; border-radius:12px; padding:18px 20px; margin-bottom:20px;">
      <p style="font-size:13px; color:#5B6660; margin:0 0 6px; font-weight:600;">Your referral link</p>
      <p style="font-size:14px; color:${BRAND_GREEN}; margin:0; word-break:break-all;">${referralLink}</p>
      <p style="font-size:12.5px; color:#5B6660; margin:10px 0 0;">Code: ${referralCode} — invite your network to move up the list and unlock rewards.</p>
    </div>
    <a href="${referralLink}" style="display:inline-block; background:${BRAND_GREEN}; color:#fff; text-decoration:none; padding:12px 22px; border-radius:9px; font-size:14.5px; font-weight:600;">Share your link</a>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to EcoTrack Novatic 🌱',
    html,
  });
}

async function sendAdminNotification({ payload }) {
  if (!ADMIN_EMAIL) return null; // silently skip if not configured
  const rows = Object.entries({
    Organization: payload.organization_name,
    'Contact Person': payload.contact_person,
    Email: payload.email,
    Phone: payload.phone_number || '—',
    Country: payload.country,
    'Organization Type': payload.organization_type,
    'Expected Trees / Year': payload.expected_trees,
    'Founding Partner': payload.founding_partner ? 'Yes' : 'No',
    'Referral Source': payload.referred_by || 'Direct',
    'Submission Time': new Date(payload.created_at).toUTCString(),
  })
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px; color:#5B6660; font-size:13px;">${k}</td><td style="padding:6px 10px; font-size:13px; font-weight:600;">${v}</td></tr>`
    )
    .join('');

  const html = emailShell(`
    <h1 style="font-family:Manrope,Arial,sans-serif; font-size:19px; color:#1A1A1A; margin:0 0 16px;">New waitlist signup</h1>
    <table style="width:100%; border-collapse:collapse;">${rows}</table>
  `);

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New signup: ${payload.organization_name}`,
    html,
  });
}

async function sendReferralRewardEmail({ to, contactPerson, referralCount, rewardLabel }) {
  const html = emailShell(`
    <h1 style="font-family:Manrope,Arial,sans-serif; font-size:20px; color:#1A1A1A; margin:0 0 14px;">🎉 You unlocked a reward!</h1>
    <p style="font-size:15px; line-height:1.6; color:#333; margin:0 0 12px;">
      Congratulations, ${contactPerson} — someone joined EcoTrack Novatic using your referral link.
    </p>
    <p style="font-size:15px; line-height:1.6; color:#333; margin:0 0 16px;">
      Current referrals: <strong>${referralCount}</strong>
    </p>
    ${
      rewardLabel
        ? `<div style="background:${BRAND_SOFT}; border-radius:12px; padding:16px 20px; margin-bottom:16px;">
             <p style="font-size:14.5px; color:${BRAND_GREEN}; font-weight:700; margin:0;">Unlocked: ${rewardLabel}</p>
           </div>`
        : ''
    }
    <p style="font-size:14px; line-height:1.6; color:#5B6660; margin:0;">Keep going to unlock more rewards.</p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: rewardLabel ? `You unlocked: ${rewardLabel} 🎉` : 'Someone joined using your referral link 🎉',
    html,
  });
}

module.exports = { sendWelcomeEmail, sendAdminNotification, sendReferralRewardEmail };
