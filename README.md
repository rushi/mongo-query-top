# MongoDB Query "Top"

A modern, full-stack MongoDB monitoring tool that presents `db.currentOp()` results in an intuitive interface. Built with TypeScript, featuring both a CLI and REST API with real-time Server-Sent Events (SSE) streaming.

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

Create `src/config/local.json` to define your MongoDB servers:

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

The `src/config/local.json` file is gitignored for security.

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

| Key | Action |
|-----|--------|
| `p` | Pause/unpause fetching and rendering |
| `r` | Reverse sort order (longest queries at top) |
| `s` | Save snapshot of current queries to disk |
| `a` | Toggle showing all queries (including system) |
| `q` or `Ctrl+C` | Quit |

### API Server Mode

```bash
# Start API server (default: port 9001)
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

## Environment Variables

Configure the API server via `.env`:

```bash
# API Server Configuration
PORT=9001
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# API Authentication
API_KEY=your-secret-api-key-here

# Frontend URLs (CORS)
FRONTEND_URL=http://localhost:9000
```

## Architecture

### Services Layer

- **MongoConnectionService** - Connection pooling and management
- **QueryService** - Business logic for query processing, filtering, and GeoIP caching
- **QueryLoggerService** - Async query logging and snapshot management

### API Layer

- **Fastify** - Fast, low-overhead web framework
- **REST endpoints** - Server and query management
- **Server-Sent Events (SSE)** - Real-time query streaming
- **CORS** - Configured for frontend integration

### CLI Layer

- **ConsoleRenderer** - Pure presentation layer for terminal output
- **Reuses services** - Same business logic as API

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
# Install dependencies
pnpm install

# Development mode (with hot reload)
pnpm run dev:cli    # CLI only
pnpm run dev:api    # API only
pnpm run dev        # Both CLI and API

# Build TypeScript
pnpm run build

# Run linter
pnpm run lint
pnpm run lint:fix

# Format code
pnpm run format

# Production mode
pnpm run start:cli
pnpm run start:api
```

## Project Structure

```
mongo-query-top/
├── src/
│   ├── app.ts                     # CLI entry point
│   ├── server.ts                  # API server entry point
│   ├── services/
│   │   ├── MongoConnectionService.ts
│   │   ├── QueryService.ts
│   │   └── QueryLoggerService.ts
│   ├── api/
│   │   └── routes/
│   │       ├── servers.ts         # Server management routes
│   │       └── queries.ts         # Query routes + SSE
│   ├── lib/
│   │   ├── ConsoleRenderer.ts     # Terminal rendering
│   │   ├── helpers.ts             # Utility functions
│   │   ├── queryProcessor.ts      # Query filtering/sanitization
│   │   └── usage.ts               # CLI argument parsing
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── config/
│       ├── default.json           # Default MongoDB URIs
│       └── local.json             # User-specific URIs (gitignored)
├── dist/                          # Compiled JavaScript
├── logs/                          # Query snapshots (gitignored)
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **MongoDB Node.js Driver v7** - Latest MongoDB driver
- **Fastify** - High-performance web framework
- **lodash-es** - Tree-shakeable utilities
- **chalk** - Terminal colors
- **cli-table3** - Beautiful terminal tables
- **dayjs** - Date formatting
- **geoip-lite** - IP geolocation with caching
- **dotenv** - Environment variables

## Future Enhancements

- [ ] Web UI with Tanstack Start + ShadCN (Phase 3 - In Progress)
- [ ] Query explain plan integration
- [ ] Historical trending with charts
- [ ] Query kill functionality
- [ ] Advanced filtering (by operation type, collection, user)
- [ ] Alerting for specific query patterns
- [ ] Integration with monitoring tools (Datadog, New Relic)

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to MongoDB
**Solution:** Check your `src/config/local.json` URI format and network access

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
