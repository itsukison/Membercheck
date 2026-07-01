# Shion — Photography Studio Staff Portal

Internal team operations dashboard for the Shion photography studio. Manage team members, bookings, availability, and analytics.

## Tech Stack

- **Framework:** Next.js 15 (React 19, App Router)
- **Auth:** Supabase Auth (email/password, JWTs)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **Payments:** Stripe SDK
- **Animation:** Motion (`motion/react`)
- **Icons:** Lucide React

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## Architecture

### Route Structure

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Staff login |
| `/signup` | Staff self-registration (studio code required) |
| `/dashboard` | Welcome screen with pending/today bookings |
| `/overview` | Weekly calendar with availability & bookings |
| `/bookings` | Full bookings table |
| `/bookings/[id]` | Single booking detail |
| `/admin/members` | Team member CRUD |

### Auth Flow

- Authentication is handled via `AuthContext` (`lib/AuthContext.tsx`).
- On load, the portal layout verifies the session and fetches the member record from the `members` table.
- Members with `status !== 'Active'` are signed out.
- Two roles: **Photographer** (manage own availability) and **Leader** (manage all members, process refunds).

### Database

The schema lives in Supabase (no local migrations). Key tables:

- **`members`** — `id`, `name`, `email`, `role`, `status`, `color`
- **`bookings`** — client bookings linked to members via `assigned_member_id`
- **`availability_slots`** — member availability with join table `availability_slot_locations`
- **`locations`** — studio locations
- **`plans`** — session plans/durations

## Member Colors

Each member has a `color` field (hex value) used to distinguish them in the weekly overview calendar. The palette includes 5 colors: pink, blue, green, amber, violet. Members can change their own color via the **Team Members** page. Leaders can set the color when creating or editing any member.

## Environment Variables

See `.env.example` for all required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (admin operations)
- `RESEND_API_KEY` — (optional) for email notifications

## Build

```
npm run build
```

Outputs a standalone Next.js build to `.next/`.
