# EnCode – Ingredient Analysis App

Analyze product ingredient lists with an LLM-backed Supabase Edge Function, view saved analyses, and manage history with Supabase auth-protected endpoints.

## Features

- Ingredient analysis via Supabase Edge Function (analyze_product)
- Supabase Auth-protected history (Postgres + RLS)
- React + Vite frontend with loading/error states
- Production-ready build via Vite

## Tech Stack

- React + Vite
- Supabase (Auth, Postgres, Edge Functions)
- TypeScript for the Edge Function

## Prerequisites

- Node.js 18+
- npm
- Supabase project + Supabase CLI installed

## Environment

Create `.env` in the project root (Vite uses `VITE_` prefixes):

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Install & Run

```bash
npm install
npm run dev      # local dev
npm run build    # production build (outputs dist/)
npm run preview  # preview production build
```

## Supabase Setup

1. **Apply schema** (from `supabase/schema.sql`):

```bash
supabase db push
# or run the SQL manually in the Supabase SQL editor
```

2. **Configure Edge Function** (`supabase/functions/analyze_product/index.ts`):

```bash
supabase functions deploy analyze_product
supabase secrets set \
  LLM_API_KEY=your-llm-key \
  SUPABASE_URL=your-supabase-url \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. **Auth redirects**: in Supabase Auth settings, add your dev/prod site URLs to Redirect URLs.

## Development Notes

- Ensure the public.analyses table and RLS policies are applied from `schema.sql`.
- The frontend expects the analyze_product function to be reachable and will surface clear errors if not.
- Keep your service role key and LLM key out of the frontend; they should only be set as Edge Function secrets.

## Deployment

- Build locally with `npm run build`; deploy the `dist/` output to your host of choice.
- Make sure the production host has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set.
