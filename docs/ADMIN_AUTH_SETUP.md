# Admin Auth Setup

Invite-only Super Admins with email/password + Google. Complete these steps before testing invites.

## 1. Database

Run in **Supabase → SQL Editor**:

`supabase/migrations/009_admin_auth.sql`

## 2. Environment

In `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3002
SUPABASE_SERVICE_ROLE_KEY=<service_role from Project Settings → API>
```

Never commit the service role key or expose it as `NEXT_PUBLIC_*`.

## 3. Supabase Auth URLs

**Authentication → URL Configuration**

- Site URL: `http://localhost:3002`
- Redirect URLs:
  - `http://localhost:3002/auth/callback`
  - `http://localhost:3002/set-password`

(Add production equivalents when you deploy.)

## 4. Email

**Authentication → Providers → Email** — enabled.  
Default Supabase mail works for testing (rate-limited). Use custom SMTP for production.

## 5. Google (optional)

1. Google Cloud Console → OAuth 2.0 Client (Web)
2. Authorized redirect URI: `https://ezyvhmatfxfmtvdqrbdp.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → Client ID + Secret → Enable

## Allowlist = `admin_profiles`

Only emails in `public.admin_profiles` (added via **Add User** or bootstrap SQL) can access the dashboard.
Google can still create a row in **Authentication → Users**, but the app signs them out / deletes them if they are not allowlisted.

## Invite email checklist

If **Add User** does not send a welcome email:

1. Auth → URL Configuration
   - Site URL: `http://localhost:3002`
   - Redirect URLs must include: `http://localhost:3002/set-password` and `http://localhost:3002/auth/callback`
2. Auth → Providers → Email enabled
3. Invite a **brand-new** email (not one that already Google-signed-in).  
   If the email already exists in Authentication → Users, no invite email is sent — they are only allowlisted and can sign in with Google.
4. Check spam for `noreply@mail.app.supabase.io`
5. Restart `npm run dev` after changing `.env.local`

## Customize invite email (recommended)

1. Open `docs/email-templates/invite-user.html`
2. Supabase → **Authentication → Emails → Templates → Invite user**
3. Set subject: `You're invited to Neev Management Portal`
4. Paste the HTML body and Save

Passwords are stored only in Supabase Auth (`auth.users`) as a secure hash — never in `admin_profiles` or app tables.
