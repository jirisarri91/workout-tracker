# Workout Tracker

Personal workout tracker with AI coaching. Built with Next.js 16, React 19, Prisma 7, Supabase (PostgreSQL), Anthropic Claude, Tailwind CSS v4, SWR, and Recharts.

> **Note for AI agents:** This is Next.js 16 — APIs and conventions differ from earlier versions. Read `node_modules/next/dist/docs/` before writing code.

---

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in your values:
   - `DATABASE_URL` — Supabase pooler URL (port 6543, for runtime)
   - `DIRECT_URL` — Supabase direct URL (port 5432, for migrations)
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

---

## Database

Schema lives in `prisma/schema.prisma`. SQL migrations are in `supabase/migrations/`.

```bash
# Regenerate Prisma client after schema changes
npx prisma generate

# Run migrations against the database
npx prisma migrate dev

# Open Prisma Studio (GUI for the DB)
npx prisma studio
```

---

## Key Pages

| Route | Purpose |
|---|---|
| `/` | Today's workout — the main daily view |
| `/planner` | Plan workouts by date |
| `/workout` | Active workout session |
| `/exercises` | Exercise library |
| `/progress` | Progress charts and PRs |
| `/mesocycles` | Mesocycle management |
| `/ai` | AI coaching and plan generation |

---

## API Routes

All under `app/api/`:

`exercises` · `workout-plans` · `workout-sessions` · `workout-templates` · `mesocycles` · `objectives` · `progress` · `weight-entries` · `weekly-schedule` · `ai`

---

## Project Structure

```
app/           # Pages and API routes (Next.js App Router)
components/    # Shared UI components
  ui/          # Primitive UI elements
  workout/     # Workout-specific components
  exercises/   # Exercise library components
  ...
lib/           # Shared utilities and DB client (lib/db.ts)
hooks/         # Custom React hooks
prisma/        # Prisma schema
supabase/      # SQL migrations
types/         # TypeScript types
generated/     # Auto-generated Prisma client (do not edit)
```

---

## Common Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```
