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

- Site URL: `http://localhost:3002` (primary — match `.env.local`)
- Redirect URLs — add every local port you might use:

| Port | Callback | Set password |
|------|----------|--------------|
| 3000 | `http://localhost:3000/auth/callback` | `http://localhost:3000/set-password` |
| 3001 | `http://localhost:3001/auth/callback` | `http://localhost:3001/set-password` |
| 3002 | `http://localhost:3002/auth/callback` | `http://localhost:3002/set-password` |
| 3003 | `http://localhost:3003/auth/callback` | `http://localhost:3003/set-password` |

`NEXT_PUBLIC_APP_URL` can only be **one** URL. Keep it as `http://localhost:3002` and always run:

```bash
npx next dev -p 3002
```

(Add production equivalents when you deploy.)

## 4. Email (Resend — required for reliable invites)

Built-in Supabase mail is rate-limited and often returns **Auth error status 500**.  
This app sends invite emails via **Resend** when `RESEND_API_KEY` is set.

1. Sign up at [resend.com](https://resend.com) and verify your domain (e.g. `neevspaces.net`)
2. Create an API key
3. Add to `.env.local` (and Render env vars in production):

```env
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Neev Spaces <noreply@neevspaces.net>
```

4. Restart the admin app after changing env

**Optional (alternative):** Supabase → Authentication → SMTP → use Resend SMTP credentials so `inviteUserByEmail` also works without the app mailer.

## 5. Google (optional)

1. Google Cloud Console → OAuth 2.0 Client (Web)
2. **Authorized JavaScript origins** (add all):
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://localhost:3002`
   - `http://localhost:3003`
3. **Authorized redirect URI** (Supabase only — not localhost):  
   `https://ezyvhmatfxfmtvdqrbdp.supabase.co/auth/v1/callback`
4. Supabase → Authentication → Providers → Google → Client ID + Secret → Enable

## Allowlist = `admin_profiles`

Only emails in `public.admin_profiles` (added via **Add User** or bootstrap SQL) can access the dashboard.
Google can still create a row in **Authentication → Users**, but the app signs them out / deletes them if they are not allowlisted.

## Invite email checklist

If **Add User** does not send a welcome email:

1. Confirm `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set (domain verified in Resend)
2. Auth → URL Configuration
   - Site URL: `http://localhost:3002` (or your Render URL in production)
   - Redirect URLs must include: `…/set-password` and `…/auth/callback`
3. Auth → Providers → Email enabled
4. Invite a **brand-new** email (not one that already Google-signed-in).  
   If the email already exists in Authentication → Users, no invite email is sent — they are only allowlisted and can sign in with Google.
5. Check spam / Resend dashboard → Emails
6. Restart `npm run dev` after changing `.env.local`

## Deploy on Render

1. Set env vars on Render: Supabase keys, Cloudinary, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
2. Set `NEXT_PUBLIC_APP_URL=https://YOUR-SERVICE.onrender.com`
3. Add the same URL to Supabase Redirect URLs + Google origins
4. Redeploy

## Customize invite email (optional for Supabase SMTP path)

1. Open `docs/email-templates/invite-user.html`
2. Supabase → **Authentication → Emails → Templates → Invite user**
3. Set subject: `You're invited to Neev Management Portal`
4. Paste the HTML body and Save

When using Resend via the app, the HTML in `src/lib/email/send-invite.ts` is used instead.
