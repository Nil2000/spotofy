# Spotofy

Listen to music together. Spotofy lets a room host create a shared listening session on Spotify — guests join, request songs, upvote tracks, and everyone sees the queue update in real time.

## How it works

1. **Sign in** with Google.
2. **Create a room** from the admin dashboard and share the room code.
3. **Guests join** the room, request songs, and upvote what they want to hear next.
4. **The room host** connects their Spotify account, plays music, and manages the queue.

The host is the only person who needs Spotify connected — everyone else participates through the web app.

## Architecture

Spotofy is split into three main pieces that work together:

```mermaid
flowchart LR
  Browser["Browser\n(Next.js web app)"]
  RoomServer["Room server\n(WebSockets)"]
  DB["PostgreSQL\n(database)"]
  Spotify["Spotify API"]

  Browser <-->|"real-time updates"| RoomServer
  Browser -->|"pages, auth, API"| DB
  RoomServer -->|"rooms, songs, votes"| DB
  Browser -->|"search & playback"| Spotify
```

| Part | What it does |
| --- | --- |
| **Web app** (`apps/web`) | The website you interact with — login, create/join rooms, search songs, and the live room UI. Runs on [http://localhost:3000](http://localhost:3000). |
| **Room server** (`apps/room-server`) | Keeps rooms in sync in real time — who joined, song requests, upvotes, and queue changes. Runs on port **3001**. |
| **Database** (`packages/db`) | Stores users, rooms, songs, and votes. Uses PostgreSQL with Prisma. |

Shared UI components live in `packages/ui`. The repo uses [Turborepo](https://turbo.build/) and [Bun](https://bun.sh/) to manage everything as a monorepo.

For deeper technical details (file layout, conventions, env vars), see [AGENTS.md](./AGENTS.md).

## Prerequisites

- [Bun](https://bun.sh/) (v1.3+)
- [Docker](https://www.docker.com/) (for local PostgreSQL)
- A **Google OAuth** app (for sign-in)
- A **Spotify Developer** app (for music search and playback)

## Run locally

### 1. Clone and install

```bash
git clone <repo-url>
cd spotofy-app
bun install
```

### 2. Start the database

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

This starts PostgreSQL on port `5432` with database `spotofy` and password `spotofy`.

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

At minimum, set these in `.env`:

```env
DATABASE_URL="postgresql://postgres:spotofy@localhost:5432/spotofy"

BETTER_AUTH_SECRET="generate-a-long-random-string"
WEB_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WEB_APP_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

NEXT_PUBLIC_WS_URL="ws://localhost:3001"
WS_PORT=3001
```

**Google OAuth:** Create credentials in the [Google Cloud Console](https://console.cloud.google.com/). Add `http://localhost:3000` as an authorized origin and `http://localhost:3000/api/auth/callback/google` as a redirect URI.

**Spotify:** Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). Add `http://localhost:3000/api/spotify/callback` as a redirect URI.

### 4. Set up the database

```bash
bun run db:generate
bun run db:migrate
```

### 5. Start the app

```bash
bun run dev
```

This starts both the web app and the room server. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Useful commands

| Command | Description |
| --- | --- |
| `bun run dev` | Start web app + room server in development |
| `bun run build` | Build all packages |
| `bun run lint` | Lint the codebase |
| `bun run check-types` | Run TypeScript checks |
| `bun run db:studio` | Open Prisma Studio (database GUI) |

To run a single app:

```bash
bunx turbo run dev --filter=web
bunx turbo run dev --filter=room-server
```

## Project structure

```
spotofy-app/
├── apps/
│   ├── web/           # Next.js frontend + API
│   └── room-server/   # WebSocket server for live rooms
├── packages/
│   ├── db/            # Database schema & client
│   └── ui/            # Shared UI components
└── docker/            # Local PostgreSQL setup
```
