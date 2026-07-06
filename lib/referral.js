const crypto = require('crypto');

// Short, human-shareable code like "K3F9QX2A". Excludes ambiguous
// characters (0/O, 1/I) so it reads cleanly in an email or on a call.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferralCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

// Generates a code and retries on the rare chance of a collision
// (unique constraint in the DB is the real guarantee; this just
// avoids a wasted round trip most of the time).
async function generateUniqueReferralCode(supabaseAdmin, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const code = generateReferralCode();
    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new Error('Could not generate a unique referral code after several attempts.');
}

// Reward tiers — used to decide whether a "you just unlocked a reward"
// email should fire after a referral count increments.
const REFERRAL_REWARDS = [
  { count: 3, label: 'Priority Early Access' },
  { count: 10, label: 'Founding Community Badge' },
  { count: 25, label: 'Exclusive Demo Invitation' },
  { count: 50, label: 'One-on-One Product Walkthrough' },
  { count: 100, label: 'Founding Partner Recognition' },
];

function rewardUnlockedAt(newCount) {
  return REFERRAL_REWARDS.find((r) => r.count === newCount) || null;
}

function referralLink(baseUrl, code) {
  return `${baseUrl.replace(/\/$/, '')}/?ref=${code}`;
}

module.exports = {
  generateUniqueReferralCode,
  REFERRAL_REWARDS,
  rewardUnlockedAt,
  referralLink,
};
