# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ACCESS Web Portal — a Next.js app for the Association of Computer Engineering Students (ACCESS) at PUP, combining an organizational directory with a physical asset borrowing/inventory system (RBAC-gated).

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml`); a `package-lock.json` also exists but pnpm is the one actually used (Dockerfile, CI).

```bash
pnpm dev            # start dev server (localhost:3000)
pnpm build          # production build
pnpm start          # run production build
pnpm lint           # eslint
pnpm img:webp       # convert images to webp via scripts/convert-to-webp.mjs
```

There is no test suite and no `format` script configured, despite `docs/STANDARDS.md` referencing `pnpm format` — don't assume either exists without checking `package.json` first.

### Docker (alternative dev flow)

```bash
docker compose watch   # dev server with live file sync, rebuilds on package.json/pnpm-lock.yaml changes
docker compose down
```

See `docs/DOCKERIZED_SETUP.md` for full setup including required `.env.local` keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus storage/Resend keys). `NEXT_PUBLIC_*` vars are baked into the client bundle at Docker build time via `--build-arg`.

### Database (Supabase)

```bash
pnpm supabase migration new <name>              # create a new migration
pnpm supabase db push                           # apply migrations
pnpm supabase migration list                    # check status
pnpm supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

Migrations live in `supabase/migrations/`, timestamp-ordered, applied in sequence. **Never edit an already-applied migration** — always add a new one. Regenerate `database.types.ts` after any schema push. Full details in `docs/backend/DATABASE_MIGRATIONS.md`.

## Architecture

### Feature-first structure

Code lives under `src/`, organized by domain, not by technical layer:

- `src/app/` — Next.js App Router entrypoints **only**: routes, layouts, route handlers. Pages should compose feature components, not hold logic. Two route groups: `(marketing)` (public: landing, auth pages) and `(internal)` (admin dashboard, gated routes).
- `src/features/<feature>/` — domain slices (`auth`, `officers`, `events`, `inventory`, `cms`, `audit`, `users`, `effects`, `landing`). Each typically has `actions/` (Server Actions), `services/` (data access, often split `*.admin.service.ts` vs `*.public.service.ts`), `components/`, and `schemas.ts` (Zod validation). If a component/helper knows about a specific business domain, it belongs here, not in `src/components` or `src/lib`.
- `src/components/ui/` — shared, domain-agnostic UI primitives only (e.g. `Navbar.tsx`). Business-specific cards (`OfficerCard`, `EventCard`) live in their feature folder instead.
- `src/lib/` — shared infrastructure: Supabase client factories (`src/lib/supabase/{admin,browser,server,middleware}-client.ts`), `errors.ts` (`AppError` + `throwSupabaseError`), `client-action-errors.ts`, `email/`, `date-utils.ts`.
- `src/configs/`, `src/providers/`, `src/utils/` — app config, React providers/composition wrappers, and generic stateless helpers respectively.

This target structure is described in `docs/ARCHITECTURE.md`; not every existing file matches it yet. When touching older code, migrate it toward this structure only if already making a substantial change there — don't do purely cosmetic moves.

### Auth & RBAC

- Roles (`Users.role` column): `Default`, `Organization`, `Pending`, `Admin`. Supabase Auth + Postgres RLS policies enforce access at the DB layer (`supabase/migrations/*_rls_*.sql`, helper functions `is_admin`/`is_authorized`).
- Route-level gating happens in `src/proxy.ts` (this project's middleware, exported as `proxy`, not `middleware.ts`) — it protects `/admin/*` (Admin role only), `/borrow/*` (authenticated only), and rewrites unauthenticated/unauthorized access to `/404` or redirects to `/auth/login`.
- Server-side action/route gating uses `src/utils/requireAdmin.ts` (redirects) and `src/utils/checkRole.ts` (throws `AppError`) — pick based on whether the caller is a page (redirect UX) or an action/API route (thrown error UX).
- Never trust `user.app_metadata.role` alone for authorization decisions that matter — the codebase re-checks the `Users` table row directly (see `src/proxy.ts`) since that's the source of truth kept in sync with RLS.

### Data access pattern

Server Actions (`features/<feature>/actions/`) call into services (`features/<feature>/services/`), which use one of the Supabase client factories in `src/lib/supabase/`:
- `server-client.ts` — user-scoped, respects RLS, for normal reads/writes.
- `admin-client.ts` — service-role, bypasses RLS, use only where an operation genuinely requires elevated privilege (already-verified admin actions, background jobs).
- `browser-client.ts` — client components.
- `middleware-client.ts` — used by `src/proxy.ts`.

API routes under `src/app/api/` mirror this split by audience: `api/admin/*`, `api/public/*`, `api/auth/*`.

### File storage

Supabase Storage with two buckets: `public-media` (event posters, officer photos) and `request-letters` (private, PDF borrow-request letters — access via `createSignedUrl()`, never public URLs). Only the storage path/URL is persisted in Postgres, never file bytes.

### Backend design docs

`docs/backend/` is the authoritative design reference for the borrowing/inventory system — check these before implementing related features:
- `PRD.md` — scope and phases
- `ERD.md` / `SCHEMA.dbml` — schema (live diagram linked from `docs/BACKEND.md`)
- `BORROWING_FLOW.md` — asset state machine
- `API_ENDPOINTS.md` — REST endpoint map
- `BEST_PRACTICES.md` — security/architecture rationale (e.g. assets are tracked as unique instances for QR/condition tracking, not quantity counters; date-range overlap checks for borrow requests; audit logging; soft deletes)
- `AUTHENTICATION.md`, `PASSWORD_RESET_FLOW.md` — auth flow specifics

## Conventions

- TypeScript strict mode; avoid `any`.
- Components: PascalCase. Hooks: `useX` camelCase. Utilities: camelCase.
- App Router components are Server Components by default — add `"use client"` only when needed for interactivity/state.
- Tailwind CSS v4 utility-first; avoid custom CSS files except for complex animations (see `globals.css`).
- Conventional Commits (`type(scope): subject`), e.g. `feat(directory): ...`, `fix(assets): ...`.
- Branch naming: `type/description` (e.g. `fix/navbar-responsiveness`).
- PRs target `dev`, not `main` — `main` is production-only (see `.github/workflows/sync-main-to-dev.yml`).
