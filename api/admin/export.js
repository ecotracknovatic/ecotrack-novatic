const { supabaseAdmin } = require('../../lib/supabaseAdmin');
const { requireAdmin } = require('../../lib/adminAuth');

function toCsvValue(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select(
      'created_at, organization_name, contact_person, email, phone_number, country, organization_type, expected_trees, founding_partner, status, referral_code, referred_by, referral_count, waitlist_position'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to export data.' });
  }

  const headers = Object.keys(
    data[0] || {
      created_at: '', organization_name: '', contact_person: '', email: '', phone_number: '',
      country: '', organization_type: '', expected_trees: '', founding_partner: '', status: '',
      referral_code: '', referred_by: '', referral_count: '', waitlist_position: '',
    }
  );

  const rows = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => toCsvValue(row[h])).join(',')),
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="ecotrack-waitlist-${Date.now()}.csv"`);
  return res.status(200).send(rows.join('\n'));
};
