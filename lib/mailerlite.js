// Uses MailerLite's v2 API (https://developers.mailerlite.com).
// Requires MAILERLITE_API_KEY and MAILERLITE_GROUP_ID env vars.
// MAILERLITE_GROUP_ID is the numeric ID of the "EcoTrack Novatic Early Access"
// group — create the group once in the MailerLite dashboard and copy its ID.

async function addToMailerLite({ email, fields = {} }) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!apiKey || !groupId) {
    console.warn('MailerLite not configured — skipping mailing list sync.');
    return null;
  }

  const res = await fetch(`https://connect.mailerlite.com/api/subscribers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      fields,
      groups: [groupId],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Don't throw — a mailing-list sync failure shouldn't block the signup.
    console.error('MailerLite sync failed:', res.status, text);
    return null;
  }

  return res.json();
}

module.exports = { addToMailerLite };
