# MongoDB Query Top - Developer Guide

## Application Overview

**mongo-query-top** is a full-stack MongoDB monitoring tool that displays MongoDB's current operations in real-time, similar to the Unix `top` command. It provides visibility into database query activity with color-coded highlighting, filtering, and automatic logging of problematic queries.

### Architecture
The application consists of three components:

1. **CLI Tool** (`src/cli.ts`) - Terminal-based monitoring interface with keyboard controls
2. **API Server** (`src/server.ts`) - Fastify REST API with Server-Sent Events for real-time streaming
3. **Web Frontend** (`frontend/`) - React dashboard with real-time query visualization

### Key Features
- **Real-time Monitoring**: Auto-refresh with configurable intervals (CLI + Web UI)
- **Intelligent Filtering**: Automatically filters system/internal queries to reduce noise
- **Performance Insights**: Highlights unindexed queries (COLLSCAN) in yellow/red
- **GeoIP Location**: Display geographic location for public IP addresses
- **Auto-Logging**: Saves long-running and problematic queries to disk
- **Client Detection**: Detects and formats various MongoDB clients (Mongoose, PHP, NoSQLBooster, etc.)
- **Interactive Controls**:
  - CLI: Keyboard controls (pause, reverse, snapshot, show all)
  - Web: Filter controls, query details dialog, server switching
- **Summary Statistics**: Operations, collections, clients, unindexed queries
- **Multi-Server Support**: Connect to multiple MongoDB servers via configuration
- **Server-Sent Events**: Real-time streaming of query data to web frontend

### Use Cases
- Find long-running queries consuming resources
- Detect unindexed collection scans that hurt performance
- Monitor query sources (which clients/IPs are hitting the database)
- Debug database performance issues in real-time
- Save snapshots of query patterns for later analysis
- Remote monitoring via web dashboard

## Architecture

### File Structure
```
mongo-query-top/
├── src/                                 # Backend TypeScript source
│   ├── cli.ts                           # CLI entry point - terminal monitoring interface
│   ├── server.ts                        # API server entry point - Fastify REST API
│   ├── lib/
│   │   ├── helpers.ts                   # Utilities: sleep, clear, raw mode, JSON formatting
│   │   ├── queryProcessor.ts            # Query filtering, sanitization, user agent detection
│   │   ├── renderer.ts                  # Table rendering with cli-table3, GeoIP, logging
│   │   ├── ConsoleRenderer.ts           # Console-specific rendering logic
│   │   └── usage.ts                     # CLI argument parsing with yargs
│   ├── services/
│   │   ├── MongoConnectionService.ts    # MongoDB connection pool management
│   │   ├── QueryService.ts              # Query processing and summary generation
│   │   └── QueryLoggerService.ts        # Query logging to disk
│   ├── api/
│   │   └── routes/
│   │       ├── queries.ts               # Query endpoints + SSE streaming
│   │       └── servers.ts               # Server connection management endpoints
│   └── types/
│       └── index.ts                     # Shared TypeScript type definitions
│
├── frontend/                            # React web frontend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── __root.tsx               # Root layout component
│   │   │   └── index.tsx                # Dashboard page component
│   │   ├── components/
│   │   │   ├── QueryTable.tsx           # Query list table with virtualization
│   │   │   ├── QueryDetails.tsx         # Query detail dialog
│   │   │   ├── FilterControls.tsx       # Filter UI controls
│   │   │   ├── SummaryStats.tsx         # Summary statistics cards
│   │   │   └── ui/                      # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useServerSentEvents.ts   # SSE connection hook with reconnection logic
│   │   │   └── useFetchServers.ts       # Fetch available servers hook
│   │   ├── store/
│   │   │   └── preferences.ts           # Zustand store for user preferences
│   │   ├── utils/
│   │   │   └── api.ts                   # API client helper
│   │   ├── types/
│   │   │   └── index.ts                 # Frontend TypeScript types
│   │   ├── router.tsx                   # TanStack Router configuration
│   │   └── styles.css                   # Global Tailwind CSS styles
│   ├── package.json
│   └── vite.config.ts                   # Vite build configuration
│
├── config/
│   ├── default.json                     # Default MongoDB server configurations
│   └── local.json                       # User-specific MongoDB URIs (gitignored)
├── logs/                                # Auto-saved query snapshots (gitignored)
│   └── <server-id>/
│       ├── raw/                         # Full raw query objects
│       └── *.json                       # Sanitized query snapshots
├── dist/                                # Compiled JavaScript output (gitignored)
├── tsconfig.json                        # Backend TypeScript configuration
└── package.json                         # Backend dependencies and scripts
```

### Key Dependencies

#### Backend
- **fastify** (^5.6.2): Fast, low-overhead web framework for the API server
- **mongodb** (^7.0.0): MongoDB Node.js driver for connecting and running currentOp
- **cli-table3** (^0.6.5): Beautiful terminal tables for CLI rendering
- **chalk** (^5.6.2): Terminal colors and styling
- **lodash-es** (^4.17.22): Utility functions for data manipulation
- **yargs** (^18.0.0): CLI argument parsing
- **dayjs** (^1.11.19): Date formatting and manipulation
- **geoip-lite** (^1.4.10): IP geolocation lookup
- **humanize-duration** (^3.33.2): Human-readable time formatting
- **tsx** (^4.21.0): TypeScript execution for development

#### Frontend
- **react** (^19.2.0): UI library
- **@tanstack/react-router** (^1.132.0): Type-safe routing with file-based routing
- **@tanstack/react-virtual** (^3.13.14): Virtualization for large query lists
- **zustand** (^5.0.9): Lightweight state management for user preferences
- **tailwindcss** (^4.0.6): Utility-first CSS framework
- **shadcn/ui**: Radix UI components styled with Tailwind (Dialog, Select, Table, etc.)
- **lucide-react** (^0.561.0): Icon library
- **date-fns** (^4.1.0): Date utilities
- **vite** (^7.1.7): Build tool and dev server

## Code Patterns

### API Server Architecture (src/server.ts)

The application includes a Fastify REST API server with the following features:

**Authentication:**
- Simple API key authentication via `X-API-Key` header or `apiKey` query parameter
- Query parameter support needed for EventSource (SSE) which doesn't support custom headers
- Set via `API_KEY` environment variable (defaults to `dev-key-change-in-production`)

**CORS Configuration:**
- Configured for `localhost:3000` (Vite dev server), `localhost:9000`, and `localhost:9173`
- Customizable via `FRONTEND_URL` environment variable
- Credentials enabled for cross-origin requests

**Service Layer Pattern:**
- Three singleton services injected into request context:
  - `MongoConnectionService`: Manages MongoDB connection pool
  - `QueryService`: Processes queries and generates summaries
  - `QueryLoggerService`: Handles query logging to disk

**Endpoints:**

1. **`GET /api/servers`** - List available MongoDB servers from config
2. **`POST /api/servers/:serverId/connect`** - Connect to a MongoDB server
3. **`POST /api/servers/:serverId/disconnect`** - Disconnect from a server
4. **`GET /api/queries/:serverId`** - One-time fetch of current queries
5. **`GET /api/queries/:serverId/stream`** - Server-Sent Events stream for real-time updates
6. **`GET /health`** - Health check endpoint (no auth required)

**Server-Sent Events (SSE):**
- Streams query data in real-time to web frontend
- Event name: `queries`
- Respects `minTime`, `refreshInterval`, and `showAll` query parameters
- Automatic cleanup on client disconnect

### Frontend Architecture (frontend/src/)

The web frontend is built with React and follows modern best practices:

**State Management:**
- **Zustand**: User preferences (serverId, minTime, refreshInterval, filters) with localStorage persistence
- **React Hooks**: Local component state for UI interactions
- **Server-Sent Events**: Real-time data streaming from API

**Key Components:**

1. **Dashboard** (`routes/index.tsx`)
   - Main page component
   - Auto-connects to MongoDB on mount
   - Displays server selector, connection status, filters, summary stats, and query table
   - Handles query detail dialog

2. **QueryTable** (`components/QueryTable.tsx`)
   - Virtualized table for performance with large query lists
   - Uses `@tanstack/react-virtual` for rendering only visible rows
   - Columns: Index, Operation ID, Runtime, Operation/Namespace, Client, Plan Summary
   - Sorted by runtime descending (longest-running queries at top)
   - New queries appear at bottom (prevents table jank)
   - Click to open detail dialog

3. **QueryDetails** (`components/QueryDetails.tsx`)
   - Dialog showing full query details
   - JSON viewer with syntax highlighting (`@microlink/react-json-view`)
   - Expandable/collapsible JSON tree

4. **FilterControls** (`components/FilterControls.tsx`)
   - UI controls for minTime, refreshInterval, showAll toggle
   - Connected to Zustand preferences store

5. **SummaryStats** (`components/SummaryStats.tsx`)
   - Cards displaying: Total Operations, Collections, Clients, Unindexed Queries
   - Real-time updates from SSE stream

**Custom Hooks:**

1. **`useServerSentEvents`** (`hooks/useServerSentEvents.ts`)
   - Manages SSE connection with automatic reconnection
   - Exponential backoff strategy (1s → 2s → 4s → ... → 30s max)
   - Returns: `{ data, error, isConnected, isReconnecting }`
   - Cleanup on unmount

2. **`useFetchServers`** (`hooks/useFetchServers.ts`)
   - Fetches available MongoDB servers from API
   - Returns: `{ servers, loading, error }`

**Routing:**
- **TanStack Router**: File-based routing with type safety
- Routes auto-generated in `routeTree.gen.ts`
- Root layout in `__root.tsx`, dashboard in `index.tsx`

**Styling:**
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components (Dialog, Select, Table, Badge, etc.)
- **CVA (class-variance-authority)**: Component variants
- **Dark Mode**: Ready but not yet implemented

**API Client:**
- Centralized API client in `utils/api.ts`
- Axios-based with base URL from `VITE_API_URL` env var (defaults to `http://localhost:9001`)
- API key in headers from `VITE_API_KEY` env var

### Configuration System
Uses the `config` package that automatically loads from `config/default.json` and `config/local.json`.

**Config Entry Format:**
```json
{
  "server-name": {
    "name": "Display Name",
    "uri": "mongodb://user:pass@host:port/db?options"
  }
}
```

**Usage:**
```bash
pnpm run dev:cli -- -c server-name
# or after building:
node dist/cli.js -c server-name
```

### Main Loop (src/cli.ts)
1. Connect to MongoDB using configured URI
2. Setup raw mode for keyboard input handling
3. Main loop:
   - Fetch `db.currentOp()` with `secs_running >= minTime` filter
   - Render header and table body
   - Sleep for refresh interval
   - Handle keyboard inputs
4. Exit on `q` or `Ctrl+C`

### Query Processing (src/lib/queryProcessor.ts)

**`shouldSkipQuery(q)`**
- Filters out system/internal queries to reduce noise
- Always shows: indexing queries, PHP MongoDB extension queries
- Skips: internal clients, monitoring modules, automation agents, hello/ismaster commands

**`sanitizeQuery(q, full)`**
- Removes verbose/sensitive fields (lsid, connectionId, clientMetadata, lockStats, etc.)
- Produces cleaner JSON for display
- `full=false` retains namespace and operation info for logging

**`formatUserAgent(q)`**
- Detects client type from `appName` and `clientMetadata`
- Returns formatted string with chalk colors
- Recognizes: NoSQLBooster, Mongoose, PHP ext-mongodb, Node.js versions

**`summarizeArray(data)`**
- Groups and counts similar items
- Returns formatted string like "5 x command, 3 x query, 1 x update"

### Rendering (src/lib/renderer.ts)

**`renderHeader()`**
- Shows: server name, refresh interval, minTime, current time, window size
- Indicates status: (paused), (reverse), showing all queries
- Displays feedback messages (e.g., "Wrote query X to disk")

**`renderBody(queries)`**
- Sorts queries by run time (longest at top for immediate visibility)
- Filters queries using `shouldSkipQuery()`
- Builds table with columns: #, ID, Age, op/ns, query
- Highlights COLLSCAN queries in yellow
- Shows GeoIP location for public IPs
- Auto-saves long-running queries and COLLSCANs
- Adds summary row with statistics

**`saveQuery(query, collection, type)`**
- Saves individual query to `logs/<config>/`
- Creates both raw and sanitized versions
- Filename format: `query-<opid>-<collection>-<type>.json`

**`save(queries)`**
- Saves snapshot of all current queries (triggered by `s` key)
- Creates timestamped files in `logs/<config>/`

### Helper Functions (src/lib/helpers.ts)

**`sleep(seconds)`**
- Promise-based sleep for loop delays
- Subtracts 100ms to account for refresh overhead

**`clear()`**
- Clears terminal screen and scroll buffer
- Uses escape codes for thorough clearing

**`setupRawMode(prefs)`**
- Configures stdin for raw mode to capture key presses
- Handles: `q`/`Ctrl+C` (quit), `p` (pause), `r` (reverse), `s` (snapshot), `a` (show all)

**`beautifyJson(payload, width)`**
- Uses `util.inspect()` for colored, formatted JSON
- Configurable width for wrapping

## Interactive Controls

When the app is running, press these keys:

| Key | Action |
|-----|--------|
| `p` | Pause/unpause fetching and rendering |
| `r` | Reverse sort order (shortest queries at top instead of longest) |
| `s` | Save snapshot of current queries to disk |
| `a` | Toggle showing all queries (including system queries) |
| `q` or `Ctrl+C` | Quit the application |

## CLI Arguments

```bash
pnpm run dev:cli -- [options]
# or after building:
node dist/cli.js [options]

Options:
  --config, -c    Server config name from config/local.json (default: "localhost")
  --refresh       Refresh interval in seconds (default: 2)
  --minTime       Only show queries running longer than X seconds (default: 1)
  --all           Show all queries without filtering (default: false)
  --log           Auto-save queries running longer than X seconds (default: 10)
  --ip            Filter by client IP address
  --help, -h      Show help
```

**Examples:**
```bash
# Basic usage with localhost
pnpm run dev:cli

# Connect to different server
pnpm run dev:cli -- -c m01

# Show fast queries with quick refresh
pnpm run dev:cli -- --minTime=0 --refresh=1

# Log queries longer than 5 seconds
pnpm run dev:cli -- --log=5

# Filter by IP address
pnpm run dev:cli -- --ip=192.168.1.100

# Show all queries including system queries
pnpm run dev:cli -- --all

# Production (after build)
node dist/cli.js -c prod --minTime=2
```

## Development Guidelines

### Frontend Development

#### Adding New UI Components

**Using shadcn/ui:**
```bash
# Add a new component from shadcn/ui
cd frontend
npx shadcn@latest add <component-name>

# Example: Add a dropdown menu component
npx shadcn@latest add dropdown-menu
```

Components will be added to `frontend/src/components/ui/` and can be imported and used immediately.

**Creating Custom Components:**

Follow the existing patterns in `frontend/src/components/`:

```typescript
// frontend/src/components/MyComponent.tsx
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface MyComponentProps {
    title: string;
    onAction?: () => void;
}

export const MyComponent = ({ title, onAction }: MyComponentProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        await onAction?.();
        setIsLoading(false);
    };

    return (
        <Card className="p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button onClick={handleClick} disabled={isLoading}>
                {isLoading ? "Loading..." : "Click Me"}
            </Button>
        </Card>
    );
};
```

**Component Patterns:**
- Use named exports (`export const MyComponent`)
- Define props interface with `ComponentNameProps`
- Use `className` prop for styling (not `style` prop)
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Prefer controlled components with state lifted to parent
- Use arrow function components
- Destructure props in function signature

#### Adding New API Endpoints

**Backend (src/api/routes/):**

```typescript
// src/api/routes/myroute.ts
import type { FastifyInstance } from "fastify";

export default async function myRoutes(fastify: FastifyInstance) {
    // GET endpoint
    fastify.get<{
        Params: { id: string };
        Querystring: { filter?: string };
    }>("/:id", async (request, reply) => {
        const { id } = request.params;
        const { filter } = request.query;

        // Access services from request context
        const client = request.services.mongoService.getConnection(id);

        return { data: "..." };
    });

    // POST endpoint
    fastify.post<{
        Body: { data: string };
    }>("/", async (request, reply) => {
        const { data } = request.body;
        return { success: true };
    });
}

// Register in src/server.ts
await fastify.register(myRoutes, { prefix: "/api/myroute" });
```

**Frontend (utils/api.ts):**

```typescript
// Add new API function
export const myApi = {
    getData: (id: string, filter?: string) =>
        apiClient.get(`/api/myroute/${id}`, { params: { filter } }),

    postData: (data: string) =>
        apiClient.post("/api/myroute", { data }),
};
```

**Usage in Component:**

```typescript
import { myApi } from "../utils/api";

const MyComponent = () => {
    const fetchData = async () => {
        try {
            const response = await myApi.getData("123", "active");
            console.log(response.data);
        } catch (error) {
            console.error("Failed to fetch:", error);
        }
    };

    // ...
};
```

#### Adding New Zustand Store

```typescript
// frontend/src/store/mystore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MyState {
    count: number;
    name: string;
    increment: () => void;
    setName: (name: string) => void;
}

export const useMyStore = create<MyState>()(
    persist(
        (set) => ({
            count: 0,
            name: "",

            increment: () => set((state) => ({ count: state.count + 1 })),
            setName: (name) => set({ name }),
        }),
        {
            name: "my-store-key", // localStorage key
        },
    ),
);

// Usage in component
import { useMyStore } from "../store/mystore";

const MyComponent = () => {
    const { count, name, increment, setName } = useMyStore();
    // ...
};
```

### Backend Development

### Adding New Query Filters

**File:** `src/lib/queryProcessor.ts`

Modify the `shouldSkipQuery()` function:

```typescript
export const shouldSkipQuery = (q: MongoQuery): boolean => {
    // Add your custom filter logic here
    if (q.appName?.match(/YourAppName/i)) {
        return true;  // Skip this query
    }

    // Check namespace
    if (q.ns === "admin.$cmd") {
        return true;
    }

    // Check command type
    if (q.command?.yourCommand) {
        return false;  // Always show this
    }

    return false;
};
```

### Customizing Table Display

**File:** `src/lib/renderer.ts`

**Adjust Column Widths:**
```typescript
const colWidths = [5, 25, 9, 25];  // Modify these values
```

**Add New Column:**
```typescript
// In renderBody()
table.push([row.idx, row.opid, row.time, row.op, query, newColumn]);
```

**Change Color Highlighting:**
```typescript
if (row.q.planSummary && row.q.planSummary === "COLLSCAN") {
    query = chalk.red(query);  // Change from yellow to red
}
```

### Adding New Server Configuration

**File:** `config/local.json`

```json
{
  "my-server": {
    "name": "My Production Server",
    "uri": "mongodb://user:pass@host:27017/dbname?authSource=admin&ssl=true"
  }
}
```

**Then run:**
```bash
pnpm run dev:cli -- -c my-server
```

### Query Logging

Queries are automatically saved to disk when:
1. Run time exceeds `--log` threshold (default 10 seconds)
2. Query uses COLLSCAN (collection scan without index)

**Log Structure:**
```
logs/
└── <config-name>/
    ├── raw/
    │   └── query-<opid>-<collection>-<type>-raw.json
    └── query-<opid>-<collection>-<type>-sanitized.json
```

**Snapshot Structure (triggered by `s` key):**
```
logs/
└── <config-name>/
    ├── queries-raw-<timestamp>.json
    └── queries-sanitized-<timestamp>.json
```

### Adding New Client Detection

**File:** `src/lib/queryProcessor.ts`, function `formatUserAgent()`

```typescript
export const formatUserAgent = (q: MongoQuery): string => {
    const { appName, clientMetadata } = q;

    // Add your custom client detection
    if (clientMetadata?.driver?.name?.match(/YourDriver/i)) {
        return chalk.bold("Your Custom Driver");
    }

    if (appName?.match(/YourApp/i)) {
        return "Your App Name";
    }

    // ... existing code
};
```

### Modifying Query Sanitization

**File:** `src/lib/queryProcessor.ts`, function `sanitizeQuery()`

**Hide Additional Fields:**
```typescript
let query = omit(q, [
    "active",
    "client",
    // Add more fields to hide
    "yourFieldToHide",
]);
```

**Show More Fields:**
Remove items from the omit arrays to include them in the output.

## Common Modifications

### Change Default Refresh Interval

**File:** `src/lib/usage.ts`
```typescript
.option("refresh", {
    default: 5,  // Change from 2 to 5 seconds
    type: "number",
    describe: "Refresh interval",
})
```

### Change Default Minimum Query Time

**File:** `src/lib/usage.ts`
```typescript
.option("minTime", {
    default: 0,  // Change from 1 to 0 to see all queries
    type: "number",
    describe: "Min runtime for queries",
})
```

### Disable Auto-Logging

**File:** `src/lib/usage.ts`
```typescript
.option("log", {
    default: Infinity,  // Change to Infinity to disable auto-logging
    type: "number",
    describe: "Save queries long running queries to disk",
})
```

Or pass `--log=999999` when running.

### Change Sort Order Default

**File:** `src/cli.ts`
```typescript
const prefs = {
    paused: false,
    reversed: false,  // Default is false (longest at top). Set to true to show shortest queries at top
    // ...
};
```

## Running the App

### Quick Start
```bash
pnpm install
pnpm run dev:cli
```

### Development Modes
```bash
# CLI only (watches and restarts on changes)
pnpm run dev:cli

# API server only
pnpm run dev:api

# Both CLI and API
pnpm run dev:both

# API + Frontend web UI
pnpm run dev:web
```

### Build and Production
```bash
# Build TypeScript to JavaScript
pnpm run build

# Run built CLI
pnpm run start:cli

# Run built API server
pnpm run start:api
```

### Format Code
```bash
pnpm run format
```
Runs Prettier on all TypeScript files in `src/`.

### Production Usage
```bash
# Monitor production server
node dist/cli.js -c prod --minTime=2 --refresh=5

# Save all long queries for analysis
node dist/cli.js -c prod --log=3 --minTime=0

# Focus on specific IP
node dist/cli.js -c prod --ip=10.0.1.50

# Quick diagnosis - show everything
node dist/cli.js -c prod --all --minTime=0 --refresh=1
```

## Code Style

### General (Backend + Frontend)
- **TypeScript**: Pure TypeScript codebase with strict type checking
- **ES Modules**: Uses `import`/`export` syntax throughout
- **Arrow Functions**: Preferred for all functions and components
- **Async/Await**: Used for all asynchronous operations
- **Formatting**: Always run `pnpm format` before every commit to ensure consistent code style
- **Named Exports**: Always use named exports (`export const Foo`), never default exports except for route files

### Backend Specific
- **Lodash-ES**: Extensively used for data manipulation (`sortBy`, `omit`, `isEmpty`, etc.)
- **Chalk**: Terminal colors throughout CLI code
- **Type Definitions**: Interfaces and types defined in `src/types/index.ts`
- **Service Pattern**: Business logic encapsulated in service classes
- **Fastify Plugins**: Routes as async functions registered with `fastify.register()`

### Frontend Specific
- **React 19**: Functional components with hooks
- **Component Structure**:
  - Define props interface as `ComponentNameProps`
  - Use destructuring in function signature
  - Keep components under 350 lines (split if larger)
  - Component files should never exceed 400 lines
- **Naming Conventions**:
  - Components: PascalCase (`QueryTable.tsx`)
  - Hooks: camelCase with `use` prefix (`useFetchServers.ts`)
  - Utilities: camelCase (`api.ts`, `utils.ts`)
  - Boolean variables: Must start with `is`, `has`, `should`, `can` (`isLoading`, `hasError`)
- **State Management**:
  - Zustand for global/persistent state
  - React hooks for local component state
  - Lift state up only when needed
- **Styling**:
  - Tailwind CSS utility classes only
  - Use `cn()` utility for conditional classes
  - No inline styles or CSS modules
  - Component variants with `cva()` from class-variance-authority
- **Type Safety**:
  - Always type component props
  - Type custom hooks return values
  - Use interfaces over types
  - Import types with `import type { ... }`
- **Imports**:
  - Sorted by prettier plugin (external → internal → relative)
  - Use path aliases if configured (`@/components/...`)
- **Error Handling**:
  - Use try-catch for async operations
  - Display user-friendly error messages in UI
  - Log errors to console for debugging

## Troubleshooting

### Backend Issues

#### Connection Issues

**Problem:** Cannot connect to MongoDB
**Solution:**
- Check your `config/local.json` URI format and network access
- Verify MongoDB server is running and accessible
- Check firewall rules and authentication credentials
- Test connection with MongoDB Compass or `mongosh`

#### Terminal Display Issues

**Problem:** Colors not showing or garbled output in CLI
**Solution:** Ensure terminal supports ANSI colors. Try different terminal emulator (iTerm2, Hyper, Windows Terminal).

#### Raw Mode Issues

**Problem:** Keys not responding in CLI
**Solution:** Terminal must support raw mode. Check if stdin is a TTY.

#### Performance Issues

**Problem:** App lags with many queries
**Solution:**
- Increase `--minTime` to filter out fast queries
- Increase `--refresh` interval
- Use `--ip` to filter by specific client

#### API Server Issues

**Problem:** API server fails to start
**Solution:**
- Check if port 9001 is already in use: `lsof -i :9001`
- Verify environment variables are set correctly
- Check logs for error messages
- Ensure MongoDB connections are configured in `config/local.json`

**Problem:** 401 Unauthorized errors
**Solution:**
- Verify `API_KEY` matches between backend `.env` and frontend `frontend/.env`
- Check that API key is being sent in requests (see Network tab in browser dev tools)
- Ensure OPTIONS requests are not blocked (CORS preflight)

### Frontend Issues

#### Build/Dev Server Issues

**Problem:** Frontend fails to start
**Solution:**
- Run `pnpm install` in `frontend/` directory
- Check for port conflicts (default: 3000)
- Clear Vite cache: `rm -rf frontend/node_modules/.vite`
- Check Node.js version (requires Node 18+)

**Problem:** TypeScript errors
**Solution:**
- Run `pnpm run build` to see all errors
- Check that types are up to date with API responses
- Verify `tsconfig.json` settings
- Restart TypeScript server in your editor

#### Connection/Streaming Issues

**Problem:** "Connection lost" error in UI
**Solution:**
- Verify API server is running on `http://localhost:9001`
- Check `VITE_API_URL` in `frontend/.env`
- Test API health endpoint: `curl http://localhost:9001/health`
- Check browser console for CORS errors
- Verify MongoDB is connected (check server logs)

**Problem:** No real-time updates
**Solution:**
- Check EventSource connection in browser Network tab (should be persistent)
- Verify SSE endpoint is working: open `http://localhost:9001/api/queries/localhost/stream?apiKey=dev-key-change-in-production` in browser
- Check if browser supports EventSource (all modern browsers do)
- Look for errors in browser console

**Problem:** CORS errors
**Solution:**
- Verify frontend URL is in API server's CORS config (`src/server.ts`)
- Check that credentials are enabled in CORS settings
- Ensure frontend is running on allowed origin (default: `localhost:3000`)
- Try clearing browser cache and cookies

#### Styling Issues

**Problem:** Tailwind classes not working
**Solution:**
- Verify `tailwind.config.js` is correct
- Check that `styles.css` is imported in root component
- Restart Vite dev server
- Check if class names are valid Tailwind utilities

**Problem:** Components not styled correctly
**Solution:**
- Ensure shadcn/ui components are installed correctly
- Check `cn()` utility is working (`lib/utils.ts`)
- Verify Radix UI dependencies are installed
- Check for CSS specificity conflicts

#### State/Data Issues

**Problem:** Preferences not persisting
**Solution:**
- Check browser localStorage (DevTools → Application → Local Storage)
- Verify Zustand persist middleware is configured
- Clear localStorage and restart: `localStorage.clear()`
- Check for errors in store initialization

**Problem:** Stale query data
**Solution:**
- Check that SSE connection is active and receiving events
- Verify `refreshInterval` is set correctly in preferences
- Check if MongoDB is returning current data (test with CLI tool)
- Look for errors in query processing (server logs)

## Environment Variables

### Backend (.env)
```bash
# API Server
API_KEY=dev-key-change-in-production   # API key for authentication
FRONTEND_URL=http://localhost:3000      # Frontend URL for CORS
LOG_LEVEL=info                          # Fastify log level (info, debug, error, etc.)
```

### Frontend (frontend/.env)
```bash
VITE_API_URL=http://localhost:9001     # Backend API URL
VITE_API_KEY=dev-key-change-in-production  # API key for authentication
```

## Development Workflow

### Running Full Stack Development
```bash
# Terminal 1: Backend API + CLI
pnpm run dev:web

# This runs both:
# - API server on http://localhost:9001
# - Frontend dev server on http://localhost:3000
```

### Running Components Separately
```bash
# Backend API only
pnpm run dev:api

# Frontend only (in frontend directory)
cd frontend && pnpm run dev

# CLI only
pnpm run dev:cli -- -c localhost
```

### Making Changes

**Backend Changes:**
1. Edit files in `src/`
2. `tsx` will auto-restart the server
3. Test API endpoints with curl or frontend

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. Vite HMR will hot-reload changes instantly
3. Check browser console for errors

**Before Committing:**
```bash
# Format backend
pnpm run format

# Format frontend
cd frontend && pnpm run format

# Build to check for TypeScript errors
pnpm run build
cd frontend && pnpm run build
```

## Future Enhancement Ideas

### CLI
- Add keyboard shortcuts for adjusting minTime/refresh on the fly
- Terminal UI framework (blessed, ink) for better interactivity
- Export to different formats (CSV, markdown, HTML)
- Better visualizations for lock contention

### Frontend
- Dark mode implementation (Tailwind classes already support it)
- Query comparison view (compare two queries side-by-side)
- Historical query view (view past snapshots)
- Query explain plan integration and visualization
- Real-time charts and graphs (query count over time, avg runtime, etc.)
- Query filtering UI (by operation type, collection, namespace, client)
- Save custom filter presets
- Export queries to CSV/JSON
- Query kill functionality with confirmation dialog
- Multi-server dashboard view (monitor multiple servers at once)
- Alerting UI (configure alerts for specific patterns)
- Mobile-responsive design improvements

### Backend/API
- Add query kill endpoint (`POST /api/queries/:serverId/:opid/kill`)
- Historical trending of query patterns (store snapshots in database)
- WebSocket support as alternative to SSE
- Query explain plan endpoint
- Alerting system for specific query patterns
- Integration with monitoring tools (Datadog, New Relic, Grafana)
- Add tests (currently no test suite)
- Rate limiting per API key
- User authentication (replace simple API key with JWT/OAuth)
- Query caching layer for repeated fetches

### Shared
- Docker support with docker-compose for easy deployment
- Kubernetes manifests
- CI/CD pipelines (GitHub Actions)
- Add comprehensive test suite (unit, integration, e2e)
- Performance benchmarks and monitoring
- Documentation improvements (OpenAPI/Swagger for API)

## Resources

### Backend
- [MongoDB currentOp Documentation](https://www.mongodb.com/docs/manual/reference/method/db.currentOp/)
- [MongoDB Profiler](https://www.mongodb.com/docs/manual/tutorial/manage-the-database-profiler/)
- [Fastify Documentation](https://fastify.dev/)
- [cli-table3 Documentation](https://github.com/cli-table/cli-table3)
- [chalk Documentation](https://github.com/chalk/chalk)

### Frontend
- [React Documentation](https://react.dev/)
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Vite Documentation](https://vite.dev/)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
