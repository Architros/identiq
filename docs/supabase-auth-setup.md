# Supabase auth and data layer setup

This guide covers configuring Supabase Auth (Google + GitHub), running the database migration, and optional Stripe keys for later.

## 1. Supabase project

1. Create a project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (server only; never commit)
3. Copy `.env.example` to `.env.local` and fill in these values.
4. Set `NEXT_PUBLIC_SITE_URL` to `http://localhost:3000` (or your production domain).
5. Set `BILLING_MODE=simulated` until Stripe is ready.

## 2. Run the database migration

In the Supabase **SQL Editor**, run the full script:

`supabase/migrations/001_initial_auth_and_core.sql`

Or with the Supabase CLI:

```bash
supabase db push
```

This creates profiles, token wallets (500 welcome tokens on signup), brands, drafts, assets, billing tables, RLS policies, and `grant_tokens` / `deduct_tokens` RPCs.

## 3. Auth URL configuration

In **Authentication → URL configuration**:

- **Site URL:** `http://localhost:3000` (production: your domain)
- **Redirect URLs:**
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`

## 4. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials** → **OAuth 2.0 Client ID** (Web application).
2. **Authorized redirect URI:** `https://<project-ref>.supabase.co/auth/v1/callback` (shown under Supabase **Authentication → Providers → Google**).
3. Copy Client ID and Secret into Supabase **Authentication → Providers → Google** and enable the provider.

## 5. GitHub OAuth

1. GitHub → **Settings → Developer settings → OAuth Apps** → **New OAuth App**.
2. **Authorization callback URL:** same Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Copy Client ID and Secret into Supabase **Authentication → Providers → GitHub** and enable the provider.

## 6. Simulated billing (default)

With `BILLING_MODE=simulated`:

1. User opens **Buy tokens** and picks a pack.
2. App creates a `billing_checkout_sessions` row via `POST /api/billing/checkout`.
3. Browser redirects to `/billing/simulated/complete?session=...`.
4. `POST /api/billing/checkout/complete` grants tokens via `grant_tokens` (service role).

No Stripe keys are required.

## 7. Stripe (when ready)

1. [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers → API keys** → `STRIPE_SECRET_KEY`.
2. Add webhook endpoint `https://your-domain.com/api/billing/webhook` → `STRIPE_WEBHOOK_SECRET`.
3. Create Products/Prices for token packs and map price IDs to `plans.stripe_price_id`.
4. Set `BILLING_MODE=stripe` and implement the Stripe provider checkout flow.

## 8. Admin role

To grant admin access, set `profiles.role` to `admin` in the Supabase table editor for your user UUID. Visit `/admin` to confirm.

## 9. Local development

```bash
npm install
npm run dev
```

Sign in at `/login`. Protected routes and APIs require a session; without Supabase env vars, middleware skips auth (local-only fallback to browser storage).
