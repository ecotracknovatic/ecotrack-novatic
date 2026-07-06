# EcoTrack Novatic — Early Access Waitlist

A production waitlist system: static landing page + Vercel serverless API routes,
backed by Supabase (database), Resend (transactional email), and MailerLite
(mailing list). Includes referral tracking, an admin dashboard, spam protection,
and CSV/Excel export.

## What's included

```
.
├── public/
│   ├── index.html        ← the landing page (unmodified design; form now calls the real API)
│   └── admin.html         ← password-protected admin dashboard
├── api/
│   ├── waitlist.js         ← main signup endpoint
│   └── admin/
│       ├── login.js        ← admin password check → signed session cookie
│       ├── stats.js         ← aggregate stats + filtered signup list (auth required)
│       └── export.js        ← CSV export (auth required)
├── lib/
│   ├── supabaseAdmin.js    ← server-side Supabase client (service role key)
│   ├── referral.js          ← referral code generation + reward tiers
│   ├── emails.js             ← Resend email templates (welcome, admin notice, referral reward)
│   ├── mailerlite.js          ← adds every signup to your MailerLite group
│   └── adminAuth.js            ← signed-cookie session helper for the admin routes
├── supabase/
│   └── schema.sql          ← run this once in your Supabase project
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once it's ready, open **SQL Editor** and paste in the entire contents of
   `supabase/schema.sql`, then run it. This creates:
   - the `waitlist` table (with a unique constraint on email, and an atomic
     sequence for waitlist position)
   - a `submission_log` table used only for rate limiting
   - an `increment_referral_count` Postgres function (atomic referral counting)
   - Row Level Security enabled with **no policies** — this is intentional.
     All reads/writes go through your serverless functions using the service
     role key, so the anon/public key can never touch this data directly.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Create a Resend account

1. Sign up at [resend.com](https://resend.com).
2. Add and verify a sending domain (Resend walks you through the DNS records).
3. Create an API key → `RESEND_API_KEY`.
4. Set `RESEND_FROM` to an address on your verified domain, e.g.
   `"EcoTrack Novatic <hello@yourdomain.com>"`.
5. Set `ADMIN_NOTIFICATION_EMAIL` to the inbox that should get a copy of every
   new signup.

## 3. Create a MailerLite account

1. Sign up at [mailerlite.com](https://mailerlite.com).
2. Create a group named **EcoTrack Novatic Early Access**.
3. Copy the group's numeric ID → `MAILERLITE_GROUP_ID`.
4. Under Integrations → API, generate a key → `MAILERLITE_API_KEY`.

If you'd rather use Brevo, swap `lib/mailerlite.js` for Brevo's REST API — the
call site in `api/waitlist.js` (`addToMailerLite(...)`) is the only place that
needs to change.

## 4. Set environment variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Fill in every value. For `ADMIN_SESSION_SECRET`, generate a real random secret:

```bash
openssl rand -hex 32
```

When you deploy to Vercel, add the same variables under
**Project Settings → Environment Variables** (do this instead of committing `.env`).

## 5. Install dependencies

```bash
npm install
```

This installs `@supabase/supabase-js` and `resend`. The admin dashboard's
Excel export loads the SheetJS library from a CDN directly in the browser, so
no build step is required for that.

## 6. Run locally

The project uses plain Vercel serverless functions (no framework), so use the
Vercel CLI for local dev — it serves `/public` as static files and `/api` as
functions, matching production exactly:

```bash
npx vercel dev
```

Visit `http://localhost:3000` for the landing page and
`http://localhost:3000/admin` for the dashboard.

## 7. Deploy to Vercel

```bash
npx vercel        # first deploy, follow the prompts to link/create a project
npx vercel --prod # promote to production
```

Or connect the GitHub repo directly in the Vercel dashboard for automatic
deploys on every push — either way, make sure all variables from
`.env.example` are set in the Vercel project first.

## How the pieces fit together

**Signup flow** (`api/waitlist.js`):
1. Rejects the request if the hidden honeypot field is filled in (bot).
2. Rejects if the same IP has made 5+ attempts in the last 10 minutes.
3. Validates required fields and email format.
4. Rejects duplicate emails (case-insensitive, enforced at the DB level too).
5. Generates a unique referral code, resolves `?ref=CODE` from the URL to a
   referrer if present, and inserts the row (`waitlist_position` is assigned
   atomically by a Postgres sequence — no race conditions under concurrent
   signups).
6. Sends the welcome email, sends you an admin notification, and adds the
   subscriber to MailerLite — all in parallel, and none of them can fail the
   user's signup if an integration has a hiccup.
7. If the signup came from a referral, atomically increments the referrer's
   count via the `increment_referral_count` Postgres function and, if they
   just crossed a reward threshold (3/10/25/50/100), emails them.

**Admin dashboard** (`public/admin.html` + `api/admin/*`):
- `login.js` checks the password against `ADMIN_PASSWORD` and issues an
  HMAC-signed, HttpOnly session cookie (12-hour expiry) — no extra auth
  dependency needed.
- `stats.js` and `export.js` both call `requireAdmin()` and reject anything
  without a valid session cookie.
- The dashboard shows total/today's signups, country and organization-type
  breakdowns (as bar charts — a full interactive world map is a natural next
  step and would slot into the same `countryCounts` data if you want to add
  a mapping library later), a referral leaderboard, and a searchable/filterable
  signup table with CSV and Excel export.

## Known scope notes

- **Rate limiting** uses a database table, which is fine at waitlist scale.
  If you expect very high traffic, consider moving this to Upstash Redis.
- **World map**: the dashboard currently shows country breakdowns as ranked
  bars rather than a literal geographic map. Swapping in a library like
  `react-simple-maps` or `amcharts` is a frontend-only change against the
  same `countryCounts` data the stats endpoint already returns.
- **Excel export** in the dashboard exports whatever's currently loaded in
  the table (capped at 200 rows by `stats.js`). The **CSV export** button
  exports the full table with no cap — use that for a complete download.
- I was not able to run `npm install`, start a live dev server, or deploy
  this to Vercel from here, since this environment has no network access.
  Every file has been written and syntax-checked, but you'll want to run
  through steps 5–7 yourself as the first real test end-to-end.
