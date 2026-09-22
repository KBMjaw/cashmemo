# One-Tap

**Your Identity. One Tap Away.**

One-Tap is a digital identity and business card platform: create a public digital
profile, list every business you run, generate a permanent QR code, and design a
print-ready business card — all connected to one link that stays current when your
details change.

## Deployment

Live on Vercel (project `one-tap`, auto-deploys from this branch until the PR merges
to `main`): **https://one-tap-black.vercel.app**

The app builds and serves correctly, but every Supabase-backed feature (auth,
profiles, storage) needs a Supabase project connected before it will work — see
"Getting started" below, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
as environment variables on the Vercel project and redeploy.

## Status

This repository currently implements **Phase 1 (Foundation)**, **Phase 2 (Digital
Identity)** and the core of **Phase 3 (QR)** and **Phase 4 (Business Cards)** from the
product spec, end to end and wired to a real Supabase backend:

- Email/password + Google auth, protected routes, session persistence
- Full Postgres schema with Row Level Security (`supabase/migrations/0001_init.sql`)
- Digital profile: personal info, photo/cover upload, privacy controls, publish states
- Multiple businesses (CRUD, reorder, set primary)
- Portfolio + professional experience
- Social links (CRUD, reorder, active toggle)
- Public profile at `/u/:username` with contact buttons, Save Contact (vCard),
  SEO meta tags, and abuse reporting
- QR code generator (standard + logo-branded), PNG/SVG download
- Business card designer (6 templates), PNG/JPG/PDF export, saved cards library
- Analytics event tracking (views, scans, clicks) + dashboard summary by time range
- Reserved usernames, friendly error states, empty states throughout

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

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migration**: open the SQL editor in your project and run the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (or use the
   Supabase CLI: `supabase db push`). This creates every table, RLS policy, storage
   bucket and the `public_profiles` view.
3. **Enable Google auth** (optional): Authentication → Providers → Google, if you want
   the "Continue with Google" button to work.
4. **Copy environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
   Project Settings → API.
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
6. Visit `http://localhost:5173`, sign up, verify your email, and complete your
   profile from the dashboard.

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
