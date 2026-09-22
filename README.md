# One-Tap

**Your Identity. One Tap Away.**

One-Tap has two modes:

- **Quick QR** (`/quick-qr`) — paste any URL, get a short `onetap.com/{code}` link and
  a QR code. No account required, and it works even without a backend connected.
- **Digital Identity** — the full product: profile, businesses, portfolio, QR and
  business card, published at the clean `onetap.com/{username}` URL. Requires login to
  manage; the public profile itself never requires login.

## Deployment

Live on Vercel (project `one-tap`, auto-deploys from this branch until the PR merges
to `main`): **https://one-tap-black.vercel.app**

- **Quick QR is fully live** — no backend dependency.
- **Digital Identity** is wired to a real Supabase project
  (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set on the Vercel project), but the
  database migrations haven't been applied to it yet — see "Getting started" below for
  the one remaining step.

## Status

This repository currently implements **Phase 1 (Foundation)**, **Phase 2 (Digital
Identity)** and the core of **Phase 3 (QR)** and **Phase 4 (Business Cards)** from the
product spec, end to end and wired to a real Supabase backend:

- Email/password + Google auth, protected routes, session persistence
- Full Postgres schema with Row Level Security (`supabase/migrations/0001_init.sql`)
- Digital profile: personal info, photo/cover upload, privacy controls, publish states
- Multiple businesses (CRUD, reorder, set primary)
- Portfolio + professional experience (separate dashboard pages)
- Social links (CRUD, reorder, active toggle)
- Public profile at the canonical `/{username}` URL (legacy `/u/:username` still works)
  with contact buttons, Save Contact (vCard), SEO meta tags, and abuse reporting
- QR code generator (standard + logo-branded), PNG/SVG/PDF download
- Business card designer (6 templates), PNG/JPG/PDF export, saved cards library
- Analytics event tracking (views, scans, clicks) + dashboard summary by time range
- Reserved usernames, friendly error states, empty states throughout
- **Quick QR** (`/quick-qr`, `supabase/migrations/0002_short_links.sql`): no-login
  URL shortener + QR generator. Short codes persist to Supabase when it's configured
  (resolvable from any device); when it isn't, codes self-encode the destination and
  resolve entirely client-side, so this mode never depends on the backend

**Not yet built** (left for a follow-up phase, with the database and UI shell already
in place to support them): payment integration, team/business accounts, the admin
panel, and image cropping in the uploader (files upload as-is today; crop is a nice-to
-have per the spec, not a blocker).

## Tech stack

- React + Vite + TypeScript + Tailwind CSS
- React Router, TanStack Query, Zustand, react-hook-form + zod
- Supabase (Postgres, Auth, Storage, Row Level Security) as the backend — no separate
  API server is required for the MVP. A `/backend` FastAPI service (per the spec's
  suggested architecture) can be introduced later for anything that needs
  server-side logic beyond what RLS policies can express.
- `qrcode` for QR generation, `jspdf` for print-ready card PDFs

## Getting started

A Supabase project (`one-tap`, ref `jnebvpimlsuctfnclgws`) already exists and its
credentials are already set as environment variables on the Vercel `one-tap` project.
**The only remaining setup step is applying the two migration files** — the automated
tool connection needed to do this dropped mid-session before it could run:

1. Open the [SQL editor](https://supabase.com/dashboard/project/jnebvpimlsuctfnclgws/sql/new)
   for the `one-tap` Supabase project.
2. Paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   in full, then paste and run
   [`supabase/migrations/0002_short_links.sql`](supabase/migrations/0002_short_links.sql).
   This creates every table, RLS policy, storage bucket, the `public_profiles` view,
   and the `short_links` table.
3. **Enable Google auth** (optional): Authentication → Providers → Google.
4. **Auth → URL Configuration**: set Site URL to `https://one-tap-black.vercel.app`
   and add `https://one-tap-black.vercel.app/**` (and `http://localhost:5173/**` for
   local dev) to Redirect URLs — otherwise verification/reset emails redirect to the
   wrong place.

Once the migration has run, Digital Identity works immediately on the existing
deployment — no redeploy needed, since the env vars are already live.

### Local development

For a totally separate/self-hosted Supabase project instead:

1. Create a project at [supabase.com](https://supabase.com) and run both migration
   files as above.
2. `cp .env.example .env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   from Project Settings → API.
3. ```bash
   npm install
   npm run dev
   ```
4. Visit `http://localhost:5173`. Quick QR works immediately; Digital Identity needs
   step 1 done first.

## Project structure

```
src/
  components/
    ui/          Reusable primitives (Button, Input, Modal, Avatar, FileUploader…)
    layout/      Shells (MarketingLayout, DashboardLayout, AuthLayout)
    dashboard/   Form components shared by dashboard pages (BusinessForm, etc.)
    profile/     Public-profile building blocks (QRGenerator, SocialIcon…)
  hooks/         TanStack Query hooks per resource + a generic CRUD factory
  lib/           Supabase client, card templates/renderer, error mapping
  pages/         Route components (marketing, auth, dashboard, public profile)
  store/         Zustand auth store
  types/         Shared TypeScript types mirroring the database schema
  utils/         Validation (zod schemas), vCard builder, className helper
supabase/
  migrations/    SQL schema, RLS policies, storage buckets
```

## Security notes

- All per-user tables are protected by Row Level Security; a user can only read,
  insert, update or delete their own rows.
- The public profile page never queries `profiles` directly — it reads from the
  `public_profiles` view, which only exposes fields the owner has explicitly made
  public and never exposes date of birth, auth data, or internal flags.
- Storage buckets restrict uploads to `<bucket>/<user_id>/…` paths and enforce
  file-type/size limits both client-side and at the bucket level.
- Deleting an account removes the profile row; `ON DELETE CASCADE` removes every
  dependent row (businesses, social links, portfolio, experience, cards, QR
  configs, analytics events). Full removal of the underlying `auth.users` record
  requires a service-role call (e.g. a Supabase Edge Function), since the anon key
  used by the client cannot delete auth users — that's the one piece of section 43
  ("Account deletion") that needs a small server-side function before going to
  production.

## What's next

See the product spec's own phase ordering for suggested next steps: pricing/
subscription enforcement, team & business accounts, the admin panel, and abuse-
report review tooling (the `profile_reports` table and reporting UI already exist;
only the admin review screen is missing).
