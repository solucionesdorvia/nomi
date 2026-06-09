<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Services overview

| Service | Purpose | How to run |
|---------|---------|-----------|
| Next.js dev server | Main app (port 3000) | `npm run dev` |
| PostgreSQL | Database | Start with `/opt/postgres/bin/pg_ctl` (see below) |

### PostgreSQL (local embedded binaries)

Binaries are at `/opt/postgres/bin/` (v16.2). Data directory: `/opt/postgres/data`.

Start (must run as user `ubuntu`):
```
su - ubuntu -c "export LD_LIBRARY_PATH=/opt/postgres/lib:\$LD_LIBRARY_PATH && /opt/postgres/bin/pg_ctl -D /opt/postgres/data -l /opt/postgres/logfile -o '-p 5432 -k /tmp' start"
```

The `DATABASE_URL` in `.env.local` uses a Unix socket: `postgresql://postgres@localhost:5432/nomi?host=/tmp`

### Key gotchas

- **Clerk blocks ALL requests** (including public routes) if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is invalid. The proxy (`proxy.ts`, Next.js 16's replacement for `middleware.ts`) validates the key format before any route handler runs. You need real Clerk test keys for the app to serve any page.
- **No automated test suite** is configured — there's no jest/vitest in `package.json`. Lint is the only automated check: `npm run lint`.
- **Prisma schema push** uses `npm run db:push` (which wraps `dotenv -e .env.local -- prisma db push`).
- **Next.js 16** uses `proxy.ts` instead of `middleware.ts`. Docs at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- The `pg` npm package is installed as an untracked dep for local DB admin scripts; it's not in `package.json`.
