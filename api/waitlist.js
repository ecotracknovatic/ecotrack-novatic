const { supabaseAdmin } = require('../lib/supabaseAdmin');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert({
        organization_name: body.organization_name || 'Test Organization',
        contact_person: body.contact_person || 'Test User',
        email: body.email || `test${Date.now()}@example.com`,
        country: body.country || 'Nigeria',
        organization_type: body.organization_type || 'School',
        expected_trees: body.expected_trees || '100',
        referral_code: `TEST${Date.now()}`
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
