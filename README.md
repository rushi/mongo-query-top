# MongoDB Query "Top"

A modern, full-stack MongoDB monitoring tool that presents `db.currentOp()` results in an intuitive interface. Built with TypeScript in a monorepo architecture, featuring a CLI, REST API with Server-Sent Events, and React web dashboard.

## Features

- **Real-time monitoring** with auto-refresh and SSE streaming
- **Intelligent filtering** of system/internal queries
- **Color-coded highlighting** for unindexed queries (COLLSCAN)
- **GeoIP location display** for public IPs
- **Auto-save** long-running and problematic queries
- **Interactive controls** (pause, reverse, snapshot, show all)
- **Multi-server support** with connection management
- **Web dashboard** with virtualized table and JSON viewer

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Configure your MongoDB servers (see Configuration section)
cp config/local.yaml.example config/local.yaml
# Edit config/local.yaml with your MongoDB URIs

# Start web dashboard (recommended)
pnpm run dev:web
# Opens http://localhost:9000

# Or start CLI only
pnpm run dev:cli
```

## Usage

### Web Dashboard (Recommended)

```bash
pnpm run dev:web
```

Opens **http://localhost:9000** with:

- Real-time query monitoring
- Interactive table with virtualization
- Query details with JSON viewer
- Server selection and connection management

### CLI Mode

```bash
# Monitor default server (localhost)
pnpm run dev:cli

# Monitor specific server
pnpm run dev:cli -- -c production

# Show queries running longer than 5 seconds with 1s refresh
pnpm run dev:cli -- --minTime=5 --refresh=1

# Filter by IP and log slow queries
pnpm run dev:cli -- --ip=192.168.1.100 --log=3
```

**CLI Options:**

```
--config, -c    Server config name (default: "localhost")
--refresh       Refresh interval in seconds (default: 2)
--minTime       Min query runtime to show (default: 1)
--all           Show system queries (default: false)
--log           Auto-save queries longer than X seconds (default: 10)
--ip            Filter by client IP address
```

**Interactive Keys:**

- `p` - Pause/unpause
- `r` - Reverse sort order
- `s` - Save snapshot to disk
- `a` - Toggle show all queries
- `q` or `Ctrl+C` - Quit

### API Server

```bash
# Start API only
pnpm run dev:api
# Runs on http://localhost:9001
```

See [API.md](API.md) for detailed API documentation.

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
├── cli/      # Terminal monitoring tool
└── web/      # React dashboard (TanStack Router, Zustand, shadcn/ui)

packages/
├── types/    # Shared TypeScript types
├── utils/    # Shared utilities
└── core/     # Business logic and services
```

**Services** (packages/core):

- `MongoConnectionService` - Connection pooling
- `QueryService` - Query processing and filtering
- `QueryLoggerService` - Logging and snapshots

## Tech Stack

- **Monorepo:** Turborepo, pnpm workspaces
- **Backend:** TypeScript, MongoDB Driver v7, Fastify, lodash-es
- **CLI:** chalk, cli-table3, yargs
- **Frontend:** React 19, TanStack Router + Virtual, Zustand, Vite, Tailwind CSS, shadcn/ui

## Development

```bash
# Install dependencies
pnpm install

# Development modes
pnpm run dev:cli    # CLI only
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
pnpm run start:cli
pnpm run start:api
```

## Documentation

- **[API.md](API.md)** - Complete API endpoint documentation
- **[CLAUDE.md](CLAUDE.md)** - Developer guide with code patterns, architecture details, and customization instructions

## Query Logging

Queries are auto-saved to `logs/<server-id>/` when:

- Runtime exceeds `--log` threshold (default: 10s)
- Query uses COLLSCAN (collection scan)
- User presses `s` (snapshot)

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

## License

MIT

## Author

[Rushi Vishavadia](https://github.com/rushi)
