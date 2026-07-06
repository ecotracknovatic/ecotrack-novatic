const { supabaseAdmin } = require('../../lib/supabaseAdmin');
const { requireAdmin } = require('../../lib/adminAuth');

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  const { search = '', country = '', orgType = '' } = req.query || {};

  // ---- Total + today's signups ----
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [{ count: total }, { count: today }] = await Promise.all([
    supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString()),
  ]);

  // ---- Full dataset for breakdowns (fine at waitlist scale; move to
  // SQL aggregates or a materialized view if this grows past ~50k rows) ----
  const { data: all, error } = await supabaseAdmin
    .from('waitlist')
    .select(
      'id, created_at, organization_name, contact_person, email, phone_number, country, organization_type, expected_trees, founding_partner, referral_code, referral_count, waitlist_position, status'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load stats.' });
  }

  const countryCounts = {};
  const orgTypeCounts = {};
  for (const row of all) {
    countryCounts[row.country] = (countryCounts[row.country] || 0) + 1;
    orgTypeCounts[row.organization_type] = (orgTypeCounts[row.organization_type] || 0) + 1;
  }

  const topReferrers = [...all]
    .filter((r) => r.referral_count > 0)
    .sort((a, b) => b.referral_count - a.referral_count)
    .slice(0, 10);

  // ---- Filtered + searched table for the dashboard's signup list ----
  let filtered = all;
  if (country) filtered = filtered.filter((r) => r.country === country);
  if (orgType) filtered = filtered.filter((r) => r.organization_type === orgType);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.organization_name?.toLowerCase().includes(q) ||
        r.contact_person?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
    );
  }

  return res.status(200).json({
    total: total || 0,
    today: today || 0,
    countryCounts,
    orgTypeCounts,
    topReferrers,
    signups: filtered.slice(0, 200), // paginate further if you expect more
  });
};
