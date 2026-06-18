# API — apps/api

Fastify REST API with Server-Sent Events for real-time query streaming. Entry point: `src/server.ts`.

## Architecture

**Authentication**: `X-API-Key` header or `?apiKey=` query param (query param needed for EventSource, which can't set headers). Configured via `API_KEY` env var.

**Service layer** — three singletons injected into request context via `request.services`:

- `MongoConnectionService` — MongoDB connection pool (`src/core/services/MongoConnectionService.ts`)
- `QueryService` — query processing and summaries (`src/core/services/QueryService.ts`)
- `QueryLoggerService` — logs queries to disk (`src/core/services/QueryLoggerService.ts`)

**Endpoints**:

```
GET  /api/servers                        list servers from config
POST /api/servers/:serverId/connect      connect to a server
POST /api/servers/:serverId/disconnect   disconnect
GET  /api/queries/:serverId              one-time query fetch
GET  /api/queries/:serverId/stream       SSE stream (params: minTime, refreshInterval, showAll)
GET  /health                             no auth required
```

**SSE stream** emits `queries` events. Cleans up automatically on client disconnect.

## Query Processing (`src/core/lib/queryProcessor.ts`)

- **`shouldSkipQuery(q)`** — filters system/internal queries. Always shows indexing ops and PHP ext queries. Skips monitoring agents, hello/ismaster commands. **Modify here to add/remove filters.**
- **`sanitizeQuery(q, full)`** — strips verbose fields (lsid, connectionId, clientMetadata, lockStats). `full=false` retains ns + op for logging. **Modify omit arrays to show/hide fields.**
- **`formatUserAgent(q)`** — detects client type from `appName`/`clientMetadata`. Recognizes NoSQLBooster, Mongoose, PHP ext-mongodb, Node.js. **Add detection patterns here.**
- **`summarizeArray(data)`** — groups items, returns `"5 x command, 3 x query"`.

## Adding Server Config

In `config/local.yaml`:

```yaml
servers:
    my-server:
        name: My Production Server
        uri: mongodb://user:pass@host:27017/db?authSource=admin
```

## Backend Style

- **Lodash-ES** for data manipulation (`sortBy`, `omit`, `isEmpty`, etc.)
- Types defined in `packages/types/src/` — prefer extending there over local types
- Routes as async functions registered with `fastify.register()` — these are the only default exports
- Business logic in service classes, not route handlers
