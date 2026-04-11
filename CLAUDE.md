# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (HMR enabled)
npm run build      # Production build → dist/
npm run lint       # ESLint (flat config, React hooks + refresh rules)
npm run preview    # Preview production build locally
```

No test suite is configured.

Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env`.

## Architecture

**Raid coordination web app** for a Korean MMO (Lost Ark). Players register raid runs, apply with their characters, and view balanced party compositions.

**Stack:** React 19 + Vite, Supabase (auth/DB/realtime), React Router v7, plain CSS, no TypeScript.

### Data Flow

1. **Auth:** Discord OAuth via Supabase → `AuthProvider` (`src/context/AuthContext.jsx`) syncs user to `profiles` table on every sign-in/update. Provides `{ user, loading }` via `useAuthContext()`.

2. **Data fetching:** Custom hooks in `src/hooks/` own all Supabase queries + realtime subscriptions. Each hook returns data + a `refetch` callback. Hooks use Supabase `postgres_changes` channels so the UI updates automatically on DB changes without polling.

3. **Party balancing:** After every fetch, `buildRaidParties()` (`src/utils/buildRaidParties.js`) runs client-side. It separates support jobs (`치유성`, `호법성`) from dealers, places supports in bottom slots first (alternating parties), then fills dealers greedily by cumulative power to minimize the gap between parties. Parties are flagged `hasRequiredSupport` and `averagePower` for display.

### Key Directories

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level components (11 pages, incl. Admin* pages) |
| `src/components/raid/` | Raid listing, detail modal, application UI |
| `src/components/raid-history/` | Completed raid views |
| `src/components/mypage/` | Character management UI |
| `src/hooks/` | Data-fetching hooks (`useRaids`, `useMyCharacters`, `useMyApplications`, `useRaidApplications`, `useMyProfile`) |
| `src/context/AuthContext.jsx` | Global auth state |
| `src/utils/buildRaidParties.js` | Party-balancing algorithm |
| `src/lib/supabase.js` | Supabase client singleton |
| `src/styles/` | Per-page and per-component CSS files |

### Database Schema (Supabase/PostgreSQL)

- `profiles` — `id` (Supabase user UUID), `discord_id`, `nickname`, `avatar_url`
- `characters` — `id`, `user_id`, `name`, `job`, `power`, `is_main`
- `raids` — `id`, `title`, `raid_date`, `start_time`, `max_members`, `description`, `is_completed`, `completed_at`
- `raid_applications` — `id`, `user_id`, `character_id`, `raid_id`, `status`

Queries use nested Supabase selects (PostgREST joins) rather than separate requests, e.g. fetching raids with their applications and character info in one call.

### Routing

React Router v7, all routes declared in `src/main.jsx` or `src/App.jsx`. No route guards — admin routes are not protected at the router level.

Navigation between pages sometimes passes `{ state: { refreshHome: Date.now() } }` to trigger a refetch on the destination page.

### Styling

Plain CSS with design tokens defined as CSS variables in `src/index.css` (e.g. `--text`, `--accent`, `--bg`, `--border`, `--shadow`). Dark mode via `@media (prefers-color-scheme: dark)`. Each page/component has a corresponding `.css` file in `src/styles/`. No Tailwind, no CSS Modules, no CSS-in-JS.

All UI text, error messages, and toasts are in Korean.
