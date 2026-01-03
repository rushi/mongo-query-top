# MongoDB Query "Top"

A modern, full-stack MongoDB monitoring tool that presents `db.currentOp()` results in an intuitive interface. Built with TypeScript in a monorepo architecture, featuring both a CLI and REST API with real-time Server-Sent Events (SSE) streaming, plus a React web dashboard.

## Features

### CLI Monitor

- **Real-time monitoring** with auto-refresh
- **Intelligent filtering** of system/internal queries
- **Color-coded highlighting** for unindexed queries (COLLSCAN)
- **GeoIP location display** for public IPs
- **Auto-save** long-running and problematic queries
- **Interactive keyboard controls** (pause, reverse, snapshot, show all)
- **Summary statistics** (operations, collections, clients, unindexed queries)

### API Server

- **REST API** for query data and server management
- **Real-time SSE streaming** for live query updates
- **Simple API key authentication**
- **CORS enabled** for frontend integration
- **Snapshot management** with query logging

### Web Dashboard

- **Real-time query monitoring** with SSE integration
- **Interactive table** with virtualization for performance
- **Query details dialog** with JSON syntax highlighting
- **Filter controls** for minTime, refresh interval, and query visibility
- **Summary statistics** cards with live updates
- **Multi-server support** with connection management

## Why?

The built-in `db.currentOp()` output has limitations:

- **JSON output** is programmer-friendly but not easily readable
- **Cluttered with system queries** you need to manually filter
- **No auto-refresh** or summary statistics
- **No persistence** of problematic queries

This tool provides:

- ✅ Human-readable tabular display
- ✅ Automatic filtering of noise
- ✅ Auto-refresh with configurable intervals
- ✅ Identify long-running queries instantly
- ✅ Detect unindexed collection scans
- ✅ Track query sources (IPs, clients, applications)
- ✅ REST API for integration with monitoring systems
- ✅ Real-time SSE streaming for dashboards

## Installation

### Prerequisites

- **Node.js >= 20**
- **pnpm** (recommended) or npm
- **MongoDB >= 6**

### Setup

```bash
# Clone the repository
git clone https://github.com/rushi/mongo-query-top.git
cd mongo-query-top

# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Copy environment variables
cp .env.example .env
# Edit .env and set your API_KEY
```

### Configuration

Create `config/local.json` to define your MongoDB servers:

```json
{
    "my-server": {
        "name": "Production MongoDB",
        "uri": "mongodb://user:pass@host:27017/db?authSource=admin"
    },
    "staging": {
        "name": "Staging MongoDB",
        "uri": "mongodb://localhost:27017"
    }
}
```

The `config/local.json` file is gitignored for security.

For the web frontend, create `apps/web/.env`:

```bash
VITE_API_URL=http://localhost:9001
VITE_API_KEY=dev-key-change-in-production
```

## Usage

### CLI Mode

```bash
# Start CLI monitor (default: localhost)
pnpm run dev:cli

# Monitor specific server
pnpm run dev:cli -- -c my-server

# Show fast queries with quick refresh
pnpm run dev:cli -- --minTime=0 --refresh=1

# Log queries longer than 5 seconds
pnpm run dev:cli -- --log=5

# Filter by IP address
pnpm run dev:cli -- --ip=192.168.1.100

# Show all queries including system queries
pnpm run dev:cli -- --all
```

#### CLI Options

```
Options:
  --config, -c    Server config name from config/local.json (default: "localhost")
  --refresh       Refresh interval in seconds (default: 2)
  --minTime       Only show queries running longer than X seconds (default: 1)
  --all           Show all queries without filtering (default: false)
  --log           Auto-save queries running longer than X seconds (default: 10)
  --ip            Filter by client IP address
  --help, -h      Show help
```

#### Interactive Controls

While the CLI is running, press:

| Key             | Action                                        |
| --------------- | --------------------------------------------- |
| `p`             | Pause/unpause fetching and rendering          |
| `r`             | Reverse sort order (longest queries at top)   |
| `s`             | Save snapshot of current queries to disk      |
| `a`             | Toggle showing all queries (including system) |
| `q` or `Ctrl+C` | Quit                                          |

### Web Dashboard Mode (Recommended)

```bash
# Start both API and frontend with one command
pnpm run dev:web
```

This starts:

- **API server** on http://localhost:9001
- **React frontend** on http://localhost:9000

Then open **http://localhost:9000** in your browser! 🌐

The web dashboard provides:

- Real-time query monitoring with automatic reconnection
- Virtualized table for high performance with large datasets
- Interactive query details with JSON viewer
- Server selection and connection management
- Persistent user preferences (stored in localStorage)

### API Server Mode

```bash
# Start API server only (default: port 9001)
pnpm run dev

# Or explicitly
pnpm run dev:api

# Start both CLI and API server (in separate terminals recommended)
# Terminal 1:
pnpm run dev:api

# Terminal 2:
pnpm run dev:cli

# Or use dev:both (note: keyboard controls won't work in this mode)
pnpm run dev:both
```

The API server will be available at `http://localhost:9001`.

## API Endpoints

All endpoints require an API key via the `X-API-Key` header.

### Health Check

```bash
GET /health
```

### Server Management

```bash
# List all configured servers
GET /api/servers

# Connect to a server
POST /api/servers/:id/connect

# Disconnect from a server
POST /api/servers/:id/disconnect

# Check server connection status
GET /api/servers/:id/status
```

### Query Operations

```bash
# Get current queries (one-time fetch)
GET /api/queries/:serverId?minTime=1&showAll=false

# Real-time SSE stream
GET /api/queries/:serverId/stream?minTime=1&refreshInterval=2&showAll=false

# Save snapshot of current queries
POST /api/queries/:serverId/snapshot?minTime=1

# List saved log files
GET /api/queries/:serverId/logs

# Read specific log file
GET /api/queries/:serverId/logs/:filename
```

### Example API Usage

```bash
# Set your API key
export API_KEY="your-secret-api-key-here"

# List servers
curl -H "X-API-Key: $API_KEY" \
  http://localhost:9001/api/servers

# Connect to a server
curl -X POST -H "X-API-Key: $API_KEY" \
  http://localhost:9001/api/servers/localhost/connect

# Get current queries
curl -H "X-API-Key: $API_KEY" \
  http://localhost:9001/api/queries/localhost

# Stream real-time updates (SSE)
curl -H "X-API-Key: $API_KEY" \
  http://localhost:9001/api/queries/localhost/stream

# Save snapshot
curl -X POST -H "X-API-Key: $API_KEY" \
  http://localhost:9001/api/queries/localhost/snapshot
```

## Configuration

This application uses YAML configuration files located in the `config/` directory. The Node.js [`config`](https://github.com/node-config/node-config) module automatically loads and merges:

1. `config/default.yaml` - Default configuration (checked into git)
2. `config/local.yaml` - Local overrides (gitignored)

### Default Configuration

The `config/default.yaml` includes:

```yaml
# MongoDB Server Configurations
servers:
    localhost:
        name: Local MongoDB
        uri: mongodb://localhost:27017

# API Server Configuration
api:
    port: 9001
    host: 0.0.0.0
    logLevel: info
    apiKey: dev-key-change-in-production
    cors:
        origins:
            - http://localhost:9000 # Vite dev server (preferred)
            - http://localhost:3000 # Vite dev server (legacy/fallback)
            - http://localhost:9173 # Vite preview server
        credentials: true

# Frontend Configuration
frontend:
    url: http://localhost:9000
```

### Local Configuration

Create `config/local.yaml` to add your MongoDB servers and override settings:

```yaml
# Add your MongoDB servers
servers:
    production:
        name: Production MongoDB Cluster
        uri: mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

    staging:
        name: Staging Environment
        uri: mongodb://user:password@staging.example.com:27017/dbname?authSource=admin

# Override API settings for local development
api:
    port: 9002
    apiKey: your-secure-api-key-here
    logLevel: debug

# Override frontend URL if needed
frontend:
    url: http://localhost:9000
```

**Note:** `config/local.yaml` is gitignored. Use `config/local.yaml.example` as a template.

## Architecture

This project uses a **monorepo structure** powered by Turborepo and pnpm workspaces:

### Monorepo Structure

- **`apps/api`** - Fastify REST API server with SSE streaming
- **`apps/cli`** - Terminal monitoring tool with keyboard controls
- **`apps/web`** - React dashboard with TanStack Router
- **`packages/types`** - Shared TypeScript type definitions
- **`packages/utils`** - Shared utility functions
- **`packages/core`** - Shared business logic and services

### Services Layer (packages/core)

- **MongoConnectionService** - Connection pooling and management
- **QueryService** - Business logic for query processing, filtering, and GeoIP caching
- **QueryLoggerService** - Async query logging and snapshot management

### API Layer (apps/api)

- **Fastify** - Fast, low-overhead web framework
- **REST endpoints** - Server and query management
- **Server-Sent Events (SSE)** - Real-time query streaming
- **CORS** - Configured for frontend integration

### CLI Layer (apps/cli)

- **ConsoleRenderer** - Pure presentation layer for terminal output
- **Reuses services** - Same business logic as API

### Web Layer (apps/web)

- **React 19** - Modern UI library
- **TanStack Router** - Type-safe file-based routing
- **TanStack Virtual** - High-performance virtualization
- **Zustand** - Lightweight state management
- **shadcn/ui** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling

## Query Logging

Queries are automatically saved to disk when:

1. **Run time exceeds `--log` threshold** (default 10 seconds)
2. **Query uses COLLSCAN** (collection scan without index)
3. **User presses `s`** to save a snapshot

### Log Structure

```
logs/
└── <config-name>/
    ├── raw/
    │   └── query-<opid>-<collection>-COLLSCAN-<type>.json
    └── queries-sanitized-<timestamp>.json
```

## Development

```bash
# Install dependencies (for all workspaces)
pnpm install

# Development mode (with hot reload via Turborepo)
pnpm run dev:cli    # CLI only
pnpm run dev:api    # API only
pnpm run dev:web    # API + Web frontend (recommended)
pnpm run dev        # All apps (API + CLI + Web)

# Build all packages with Turborepo
pnpm run build

# Build specific package
turbo build --filter=@mongo-query-top/api
turbo build --filter=@mongo-query-top/cli
turbo build --filter=@mongo-query-top/web

# Format code (runs across all workspaces)
pnpm run format

# Production mode
pnpm run start:cli
pnpm run start:api
```

### Turborepo Commands

The monorepo uses Turborepo for orchestration:

```bash
# Build everything (with caching)
turbo build

# Dev mode for specific app
turbo dev --filter=@mongo-query-top/api

# Clean all outputs
turbo clean

# Run format across all packages
turbo format
```

## Project Structure

```
mongo-query-top/
├── apps/
│   ├── api/                          # Fastify REST API + SSE server
│   │   ├── src/
│   │   │   ├── server.ts             # API entry point
│   │   │   └── routes/
│   │   │       ├── queries.ts        # Query routes + SSE
│   │   │       └── servers.ts        # Server management routes
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                          # Terminal monitoring tool
│   │   ├── src/
│   │   │   ├── cli.ts                # CLI entry point
│   │   │   ├── ConsoleRenderer.ts    # Terminal rendering
│   │   │   └── lib/
│   │   │       ├── renderer.ts       # Table rendering
│   │   │       └── usage.ts          # CLI argument parsing
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # React dashboard
│       ├── src/
│       │   ├── routes/               # TanStack Router routes
│       │   ├── components/           # React components
│       │   ├── hooks/                # Custom React hooks
│       │   ├── store/                # Zustand state management
│       │   └── utils/                # Frontend utilities
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── api.ts                # API contract types
│   │   │   ├── mongo.ts              # MongoDB types
│   │   │   ├── shared.ts             # Shared types
│   │   │   └── index.ts              # Barrel exports
│   │   └── package.json
│   │
│   ├── utils/                        # Shared utilities
│   │   ├── src/
│   │   │   ├── cn.ts                 # Tailwind class merger
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── core/                         # Shared business logic
│       ├── src/
│       │   ├── services/
│       │   │   ├── MongoConnectionService.ts
│       │   │   ├── QueryService.ts
│       │   │   └── QueryLoggerService.ts
│       │   ├── lib/
│       │   │   ├── queryProcessor.ts # Query filtering
│       │   │   └── helpers.ts        # Utility functions
│       │   └── index.ts
│       └── package.json
│
├── config/
│   ├── default.json                  # Default MongoDB configs
│   └── local.json                    # User configs (gitignored)
│
├── logs/                             # Query snapshots (gitignored)
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # pnpm workspace definition
├── tsconfig.base.json                # Shared TypeScript config
├── prettier.config.js                # Shared Prettier config
├── .env                              # API env vars (gitignored)
├── package.json                      # Root workspace package
└── README.md
```

## Tech Stack

### Monorepo & Build

- **Turborepo** - High-performance build system with caching
- **pnpm workspaces** - Fast, disk-efficient package manager

### Backend (API + CLI)

- **TypeScript** - Type-safe JavaScript
- **MongoDB Node.js Driver v7** - Latest MongoDB driver
- **Fastify** - High-performance web framework
- **lodash-es** - Tree-shakeable utilities
- **chalk** - Terminal colors
- **cli-table3** - Beautiful terminal tables
- **dayjs** - Date formatting
- **geoip-lite** - IP geolocation with caching
- **dotenv** - Environment variables

### Frontend (Web Dashboard)

- **React 19** - Modern UI library
- **TanStack Router** - Type-safe file-based routing
- **TanStack Virtual** - High-performance list virtualization
- **Zustand** - Lightweight state management
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible component system
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Icon library

## Future Enhancements

- [x] Web UI with React + TanStack Router + shadcn/ui ✅ **Complete**
- [ ] Dark mode implementation in web UI
- [ ] Query explain plan integration
- [ ] Historical trending with charts
- [ ] Query kill functionality via web UI
- [ ] Advanced filtering (by operation type, collection, user)
- [ ] Alerting for specific query patterns
- [ ] Integration with monitoring tools (Datadog, New Relic)
- [ ] Docker support with docker-compose
- [ ] Kubernetes manifests
- [ ] CI/CD pipelines

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to MongoDB
**Solution:** Check your `config/local.json` URI format and network access

### Terminal Display Issues

**Problem:** Colors not showing or garbled output
**Solution:** Ensure terminal supports ANSI colors

### API Authentication

**Problem:** Getting 401 Unauthorized
**Solution:** Ensure `X-API-Key` header matches the `API_KEY` in `.env`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

[Rushi Vishavadia](https://github.com/rushi)

## Acknowledgments

Built with modern TypeScript practices, clean architecture, and performance in mind.
