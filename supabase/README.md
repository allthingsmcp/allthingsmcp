# Supabase setup

Supabase owns ATM accounts, session cookies, profile preferences, and the
database used by Guide Runtime.

1. Link this directory to the Supabase project and run `supabase db push`.
2. Enable GitHub under Authentication → Providers. Set GitHub's OAuth callback
   to the callback URL shown by Supabase.
3. Add `http://localhost:3000/auth/callback` and the production equivalent to
   Authentication → URL Configuration → Redirect URLs.
4. Deploy the welcome email function with
   `supabase functions deploy welcome-email --no-verify-jwt`.
5. Set `RESEND_API_KEY`, `WELCOME_EMAIL_FROM`,
   `WELCOME_EMAIL_WEBHOOK_SECRET`, and `SITE_URL` with `supabase secrets set`.
6. Create a Database Webhook for `INSERT` on `public.profiles`. Point it to the
   `welcome-email` Edge Function and add
   `Authorization: Bearer <WELCOME_EMAIL_WEBHOOK_SECRET>`.

The profile trigger is intentionally small because a failing `auth.users`
trigger can block account creation. Email delivery is asynchronous through the
Database Webhook and does not block sign-in.
