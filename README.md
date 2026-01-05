<div align="center">
  <img src="docs/logo.png" alt="MongoDB Query Top Logo" width="100" />
  <h1>MongoDB Query "Top"</h1>
</div>

A modern, full-stack MongoDB monitoring tool that presents `db.currentOp()` results in an intuitive interface. Built with TypeScript in a monorepo architecture, featuring a REST API with Server-Sent Events and a React web dashboard.

## Features

- **Real-time monitoring** with auto-refresh and SSE streaming
- **Intelligent filtering** of system/internal queries
- **Color-coded highlighting** for unindexed queries (COLLSCAN)
- **GeoIP location display** for public IPs
- **Auto-save** long-running and problematic queries
- **Interactive controls** (pause, reverse, snapshot, show all)
- **Multi-server support** with connection management
- **Web dashboard** with virtualized table and JSON viewer

## Why?

The built-in `db.currentOp()` has limitations:

- ❌ JSON output not easily readable
- ❌ Cluttered with system queries
- ❌ No auto-refresh or persistence
- ❌ No summary statistics

This tool provides:

- ✅ Human-readable tabular display
- ✅ Automatic filtering of noise
- ✅ Auto-refresh and real-time streaming
- ✅ Instant identification of slow queries
- ✅ Detection of unindexed scans
- ✅ REST API and web dashboard

## Screenshot

![MongoDB Query Top Dashboard](docs/screenshot.png)

## Quick Start

```bash
pnpm install

# Configure your MongoDB servers (see Configuration section)
cp config/local.yaml.example config/local.yaml

# Start web dashboard
pnpm run dev:web
```

## Docker Setup

Run both API and Web services in containers:

```bash
# 1. Configure MongoDB and API settings in config/local.yaml
cp config/local.yaml.example config/local.yaml

# 2. Build Docker images (generates config from YAML - no env vars!)
pnpm docker:build

# 3. Start services
docker compose up -d
```

**Access:** Web UI at http://localhost:9000, API at http://localhost:9001

**Production:** `pnpm docker:build https://api.yourdomain.com`

See **[docs/DOCKER.md](docs/DOCKER.md)** for complete documentation including production deployment, SSE-capable reverse proxy configuration, troubleshooting, and more.

## Usage

### Web Dashboard

```bash
pnpm run dev:web
```

Opens **http://localhost:9000** with:

- Real-time query monitoring
- Interactive table with virtualization
- Query details with JSON viewer
- Server selection and connection management

### API Server

```bash
# Start API only on http://localhost:9001
pnpm run dev:api
```

See [docs/API.md](docs/API.md) for detailed API documentation.

## Configuration

Uses YAML configuration files in `config/`:

**config/default.yaml** (checked into git):

```yaml
servers:
    localhost:
        name: Local MongoDB
        uri: mongodb://localhost:27017

api:
    port: 9001
    host: 0.0.0.0
    logLevel: info
    apiKey: dev-key-change-in-production
    cors:
        origins:
            - http://localhost:9000
        credentials: true
```

**config/local.yaml** (gitignored - your servers):

```yaml
servers:
    production:
        name: Production Cluster
        uri: mongodb+srv://user:pass@cluster.mongodb.net/db

    staging:
        name: Staging
        uri: mongodb://user:pass@staging:27017/db?authSource=admin

# Override API settings
api:
    apiKey: your-secure-api-key-here
    logLevel: debug
```

Copy `config/local.yaml.example` to get started.

## Architecture

**Monorepo Structure** (Turborepo + pnpm workspaces):

```
apps/
├── api/      # Fastify REST API + SSE streaming
│             # Includes MongoDB services and query processing
└── web/      # React dashboard (TanStack Router, Zustand, shadcn/ui)
│             # Includes utility functions for styling

packages/
└── types/    # Shared TypeScript types
```

**Services** (apps/api/src/core):

- `MongoConnectionService` - Connection pooling
- `QueryService` - Query processing and filtering
- `QueryLoggerService` - Logging and snapshots

## Tech Stack

- **Monorepo:** Turborepo, pnpm workspaces
- **Backend:** TypeScript, MongoDB Driver v7, Fastify, lodash-es
- **Frontend:** React 19, TanStack Router + Virtual, Zustand, Vite, Tailwind CSS, shadcn/ui

## Development

```bash
# Install dependencies
pnpm install

# Development modes
pnpm run dev:api    # API only
pnpm run dev:web    # API + Web (recommended)
pnpm run dev        # All apps

# Build all packages
pnpm run build

# Build specific package
turbo build --filter=@mongo-query-top/api

# Format code
pnpm run format

# Production
pnpm run start:api
```

## Documentation

- **[docs/API.md](docs/API.md)** - Complete API endpoint documentation
- **[docs/DOCKER.md](docs/DOCKER.md)** - Docker deployment guide with production setup and SSE support
- **[CLAUDE.md](CLAUDE.md)** - Developer guide with code patterns, architecture details, and customization instructions

## Query Logging

Queries are auto-saved to `logs/<server-id>/` when:

- Runtime exceeds configured threshold (default: 10s)
- Query uses COLLSCAN (collection scan)

## License

MIT

## Author

[Rushi Vishavadia](https://github.com/rushi)
