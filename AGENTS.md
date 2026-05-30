# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

**Spotofy** is a collaborative Spotify listening app. Room admins create listening rooms; guests join, request songs, and upvote tracks. The room admin plays music through Spotify and controls the queue in real time.

The repo is a **Turborepo monorepo** managed with **Bun** workspaces.

## Repository layout

```
spotofy-app/
├── apps/
│   ├── web/              # Next.js 16 App Router frontend + REST API routes
│   └── room-server/      # Bun WebSocket server for real-time room state
├── packages/
│   ├── db/               # Prisma schema, migrations, shared DB client (@repo/db)
│   ├── ui/               # Shared shadcn/ui component library (@repo/ui)
│   ├── tailwind-config/  # Shared Tailwind v4 config
│   ├── eslint-config/    # Shared ESLint configs (@repo/eslint-config)
│   └── typescript-config/# Shared tsconfigs (@repo/typescript-config)
├── docker/
│   └── docker-compose.dev.yml  # Local PostgreSQL
└── .env                    # Root env file (not committed; copy from .env.example)
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| UI library | shadcn/ui (`base-nova` style), `@base-ui/react`, Lucide icons |
| Auth | [better-auth](https://www.better-auth.com/) with Google OAuth + Prisma adapter |
| Database | PostgreSQL 17, Prisma 7 (`@prisma/adapter-pg`) |
| Real-time | WebSocket server (`ws`) in `apps/room-server` |
| Music | Spotify OAuth + Web Playback SDK (admin only) |
| Validation | Zod 4 |
| Monorepo | Turborepo 2 |

## Architecture

Two runtimes share `@repo/db`:

1. **`apps/web`** — HTTP layer
   - Pages, layouts, and client UI
   - REST API routes under `app/api/`
   - Auth via better-auth (`/api/auth/[...all]`)
   - Spotify OAuth/token/search routes under `/api/spotify/`
   - Room CRUD under `/api/rooms`

2. **`apps/room-server`** — Real-time layer
   - WebSocket server on `WS_PORT` (default **3001**)
   - In-memory room state (`Room` class) backed by Prisma for persistence
   - Handles join flow, song requests, upvotes, queue updates, admin approvals

The web app connects to the room server via `NEXT_PUBLIC_WS_URL` (see `apps/web/hooks/useWebSocket.ts`).

### Key routes (web)

| Path | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` | Google sign-in |
| `/admin` | Create/manage rooms (admin dashboard) |
| `/join` | Join a room by code |
| `/room/[code]` | Live room UI (`code` = room `id` from Prisma) |

Route protection is defined in `apps/web/lib/routes.ts`. Auth redirects live in `apps/web/proxy.ts` (Next.js 16 replacement for `middleware.ts`). Pages also perform their own session checks (e.g. `app/room/[code]/page.tsx`).

### Database models

Defined in `packages/db/prisma/schema.prisma`:

- **User** — auth + Spotify token fields
- **Room** — admin, limits (`maxUpvotes`, `maxUsers`), auto-approve flags
- **Song** — queue items with `SongStatus` enum (`REQUESTED`, `QUEUED`, `PLAYING`, `REJECTED`)
- **SongUpvoteHistory** — one upvote per user per song per room

After schema changes, run migrations from the repo root (see Commands below).

### WebSocket protocol

Message type constants are duplicated in:

- `apps/web/lib/constants.ts`
- `apps/room-server/src/constants.ts`

Zod schemas and TypeScript types live in:

- `apps/web/types/websocket.ts` (client)
- `apps/room-server/src/types.ts` (server)

**When adding or changing WebSocket message types, update both apps and keep constants in sync.**

Server handlers: `apps/room-server/src/handerFunctions.ts` (note the filename spelling).

## Environment variables

Root `.env` is loaded by apps via `dotenv-cli` (e.g. `dotenv -e ../../.env`).

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | db, web, room-server | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | web | Auth signing secret |
| `WEB_APP_URL` | web | better-auth base URL (server) |
| `NEXT_PUBLIC_WEB_APP_URL` | web (client) | Public app URL for OAuth callbacks |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | web | Google OAuth |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | web | Spotify OAuth + API |
| `WS_PORT` | room-server | WebSocket listen port (default 3001) |
| `NEXT_PUBLIC_WS_URL` | web (client) | WebSocket URL (default `ws://localhost:3001`) |

Copy `.env.example` to `.env` and fill in values. Spotify vars are required for music features but are not yet listed in `.env.example`.

Local DB: `docker compose -f docker/docker-compose.dev.yml up -d` (Postgres on port 5432, user/db/password: `spotofy`).

## Commands

Always use **Bun** — do not use npm, yarn, or pnpm.

```bash
bun install                  # Install all workspace dependencies
bun run dev                  # Start all apps (web :3000, room-server :3001)
bun run build                # Build all packages/apps
bun run lint                 # Lint entire monorepo
bun run check-types          # Type-check entire monorepo
bun run format               # Prettier format

# Database (runs via turbo → @repo/db)
bun run db:generate          # Generate Prisma client
bun run db:migrate           # Create/apply migrations (dev)
bun run db:deploy            # Apply migrations (production)
bun run db:studio            # Prisma Studio

# Filter to a single package
bunx turbo run dev --filter=web
bunx turbo run dev --filter=room-server
bunx turbo run build --filter=@repo/db
```

Prisma client output: `packages/db/generated/prisma/`. Import via `@repo/db`.

## Package manager

- Install packages: `bun add <package>` (from the relevant workspace directory, or `-w` at root)
- Dev dependencies: `bun add -d <package>`
- Run scripts: `bun run <script>`

## UI & components

- Prefer **shadcn/ui** components from `@repo/ui`.
- Components live in `packages/ui/src/components/ui/`.
- Import pattern: `@repo/ui/components/ui/<component>` (e.g. `@repo/ui/components/ui/button`).
- Global styles: `@repo/ui/globals.css` (imported in `apps/web/app/layout.tsx`).
- Theme: dark default via `next-themes` (`apps/web/components/theme-provider.tsx`).
- Toasts: `@repo/ui/components/ui/sonner`.

### Adding shadcn components

Install new components into **`packages/ui`** using its `components.json` (`style: base-nova`). Do not add shadcn components directly under `apps/web` unless they are app-specific.

- Use Tailwind utility classes and existing CSS variables from `packages/ui/src/styles/globals.css`.
- Avoid arbitrary new colors; follow the neutral theme tokens.
- Spotify album art is allowed via `next/image` remote pattern for `i.scdn.co`.

## React & Next.js conventions

### File naming

- **New component files: kebab-case** — e.g. `room-header.tsx`, `sign-in-form.tsx`
- **Component names: PascalCase** — e.g. `RoomHeader`, `SignInForm`
- Some legacy files use camelCase (e.g. `signIn.tsx`); follow kebab-case for new files.

### App Router patterns

- **Server pages** fetch session/data, then render a **`_client.tsx`** client component for interactivity.
- Co-locate route-specific components in `_components/` next to the page.
- Path alias in web: `@/*` → `apps/web/*`
- Path alias for UI: `@repo/ui/*` → `packages/ui/src/*`

Example (room page):

```
app/room/[code]/
├── page.tsx              # Server component: auth + data loading
└── _components/
    ├── _client.tsx       # Client shell: WebSocket + layout
    ├── room-header.tsx
    └── queue-sidebar.tsx
```

### API routes

- Use Route Handlers in `app/api/**/route.ts`.
- Validate request bodies with Zod (`safeParse`).
- Check session via `auth.api.getSession({ headers: req.headers })`.
- Use `prisma` from `@repo/db` for database access.

### Auth

- Server: `auth` from `@/lib/auth`
- Client: `signIn` / `signOut` from `@/lib/auth-client`
- Do not put heavy auth logic in `proxy.ts`; keep detailed checks in pages and route handlers.

## Shared packages

| Package | Import | Notes |
| --- | --- | --- |
| `@repo/db` | `import { prisma } from "@repo/db"` | Also re-exports Prisma types |
| `@repo/ui` | `@repo/ui/components/ui/*` | Transpiled by Next via `transpilePackages` |
| `@repo/eslint-config` | Extended in each app's `eslint.config.*` | `--max-warnings 0` in CI |
| `@repo/typescript-config` | Extended in each `tsconfig.json` | |

## CI

GitHub Actions workflows (path-filtered per package):

- `ci-web.yml` — build, lint, type-check for `web` (+ db/ui deps)
- `ci-room-server.yml` — build, lint, type-check for `room-server`
- `ci-db.yml` — build, type-check for `@repo/db`
- `ci-ui.yml` — build, lint, type-check for `@repo/ui`

All use Bun 1.3.6 and `bun install --frozen-lockfile`.

## General guidelines

- Keep changes minimal and scoped to the requested task.
- Match existing patterns in the file or directory you are editing.
- When touching Prisma schema, add a migration — do not only edit the schema file.
- When touching WebSocket messages, update web client, room-server, and Zod schemas together.
- `apps/web/next.config.ts` has `typescript.ignoreBuildErrors: true` — still run `bun run check-types` locally.
- Do not commit `.env` or secrets.
