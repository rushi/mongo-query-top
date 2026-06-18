# MongoDB Query Top

Real-time MongoDB operation monitor (like Unix `top`) — Turborepo monorepo with a Fastify API and React dashboard.

## Monorepo Layout

```
apps/api/        Fastify REST API + SSE server (port 9001)
apps/web/        React dashboard — Vite + TanStack Router (port 9000)
packages/types/  Shared TypeScript types (API contracts, MongoDB types)
config/          YAML config (default.yaml checked in, local.yaml gitignored)
```

## Key Commands

```bash
pnpm run dev:web    # API + frontend (most common)
pnpm run dev:api    # API only
pnpm run build      # build all packages
pnpm run format     # Prettier across all packages — run before every commit
```

## Configuration System

Uses the Node.js `config` package — merges `config/default.yaml` → `config/local.yaml`.

```yaml
servers:
    my-server:
        name: Display Name
        uri: mongodb://user:pass@host:27017/db

api:
    port: 9001
    apiKey: dev-key-change-in-production
```

In code: `config.get<string>("api.apiKey")`, `config.get<Record<string, ServerConfig>>("servers")`

## Environment Variables

**`apps/api/.env`**

```bash
API_KEY=dev-key-change-in-production
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

**`apps/web/.env`**

```bash
VITE_API_URL=http://localhost:9001
VITE_API_KEY=dev-key-change-in-production
```

## Code Style (all packages)

- TypeScript strict mode, ES modules (`import`/`export`) throughout
- Arrow functions preferred; async/await for all async ops
- Named exports always (`export const Foo`) — default exports only for Fastify route files
- Run `pnpm format` before every commit
- Use package.json scripts (`npm run lint`) not direct tool invocation (`npx eslint`)
- After multi-file edits: run `pnpm build` to catch TypeScript errors before declaring done

## Docker

See [docs/DOCKER.md](docs/DOCKER.md). Config-driven — no env vars needed, reads `config/local.yaml`.
