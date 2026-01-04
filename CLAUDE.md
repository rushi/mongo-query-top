# MongoDB Query Top - Developer Guide

## Application Overview

**mongo-query-top** is a full-stack MongoDB monitoring tool that displays MongoDB's current operations in real-time, similar to the Unix `top` command. It provides visibility into database query activity with color-coded highlighting, filtering, and automatic logging of problematic queries.

### Architecture

This is a **Turborepo monorepo** with three applications and three shared packages:

**Applications:**

1. **CLI Tool** (`apps/cli/`) - Terminal-based monitoring interface with keyboard controls
2. **API Server** (`apps/api/`) - Fastify REST API with Server-Sent Events for real-time streaming
3. **Web Frontend** (`apps/web/`) - React dashboard with real-time query visualization

**Shared Packages:**

1. **types** (`packages/types/`) - Shared TypeScript type definitions for API contracts
2. **utils** (`packages/utils/`) - Shared utility functions (cn, etc.)
3. **core** (`packages/core/`) - Shared business logic, services, and MongoDB operations

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

### Monorepo Structure (Turborepo + pnpm workspaces)

```
mongo-query-top/
├── apps/
│   ├── api/                             # Fastify REST API + SSE server
│   │   ├── src/
│   │   │   ├── server.ts                # API entry point
│   │   │   └── routes/
│   │   │       ├── queries.ts           # Query endpoints + SSE streaming
│   │   │       └── servers.ts           # Server connection management
│   │   ├── package.json                 # Depends: @mongo-query-top/core, types
│   │   └── tsconfig.json
│   │
│   ├── cli/                             # Terminal monitoring tool
│   │   ├── src/
│   │   │   ├── cli.ts                   # CLI entry point
│   │   │   ├── ConsoleRenderer.ts       # Terminal rendering logic
│   │   │   └── lib/
│   │   │       ├── renderer.ts          # Table rendering with cli-table3
│   │   │       └── usage.ts             # CLI argument parsing with yargs
│   │   ├── package.json                 # Depends: @mongo-query-top/core, types
│   │   └── tsconfig.json
│   │
│   └── web/                             # React dashboard (Vite + TanStack Router)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── __root.tsx           # Root layout component
│       │   │   └── index.tsx            # Dashboard page component
│       │   ├── components/
│       │   │   ├── QueryTable.tsx       # Virtualized query list table
│       │   │   ├── QueryDetails.tsx     # Query detail dialog
│       │   │   ├── FilterControls.tsx   # Filter UI controls
│       │   │   ├── SummaryStats.tsx     # Summary statistics cards
│       │   │   └── ui/                  # shadcn/ui components
│       │   ├── hooks/
│       │   │   ├── useServerSentEvents.ts  # SSE hook with auto-reconnect
│       │   │   └── useFetchServers.ts   # Fetch servers hook
│       │   ├── store/
│       │   │   └── preferences.ts       # Zustand store for user prefs
│       │   └── utils/
│       │       └── api.ts               # API client helper
│       ├── package.json                 # Depends: @mongo-query-top/types, utils
│       ├── tsconfig.json
│       └── vite.config.ts               # Vite config (port 9000)
│
├── packages/
│   ├── types/                           # Shared TypeScript type definitions
│   │   ├── src/
│   │   │   ├── api.ts                   # API contract types (ProcessedQuery, etc.)
│   │   │   ├── mongo.ts                 # MongoDB types (MongoQuery, ServerConfig)
│   │   │   ├── shared.ts                # Shared types (GeoLocation)
│   │   │   └── index.ts                 # Barrel exports
│   │   ├── package.json                 # No dependencies (private package)
│   │   └── tsconfig.json
│   │
│   ├── utils/                           # Shared utility functions
│   │   ├── src/
│   │   │   ├── cn.ts                    # Tailwind class name merger
│   │   │   └── index.ts                 # Barrel exports
│   │   ├── package.json                 # Depends: clsx, tailwind-merge
│   │   └── tsconfig.json
│   │
│   └── core/                            # Shared business logic & services
│       ├── src/
│       │   ├── services/
│       │   │   ├── MongoConnectionService.ts  # MongoDB connection pool
│       │   │   ├── QueryService.ts      # Query processing & filtering
│       │   │   └── QueryLoggerService.ts # Query logging to disk
│       │   ├── lib/
│       │   │   ├── queryProcessor.ts    # Query filtering, sanitization
│       │   │   └── helpers.ts           # Utilities: sleep, clear, etc.
│       │   └── index.ts                 # Barrel exports
│       ├── package.json                 # Depends: @mongo-query-top/types, mongodb
│       └── tsconfig.json
│
├── config/
│   ├── default.yaml                     # Default MongoDB server configurations
│   └── local.yaml                       # User-specific MongoDB URIs (gitignored)
│
├── logs/                                # Auto-saved query snapshots (gitignored)
│   └── <server-id>/
│       ├── raw/                         # Full raw query objects
│       └── *.json                       # Sanitized query snapshots
│
├── turbo.json                           # Turborepo pipeline configuration
├── pnpm-workspace.yaml                  # pnpm workspace definition
├── tsconfig.base.json                   # Shared TypeScript base config
├── prettier.config.js                   # Shared Prettier configuration
├── .env                                 # API environment variables (gitignored)
└── package.json                         # Root workspace package.json
```

### Key Dependencies

#### Monorepo Infrastructure

- **turbo** (^2.4.0): Monorepo build system with intelligent caching
- **pnpm** (^10.8.0): Fast, disk space-efficient package manager with workspace support

#### Shared Packages

**packages/types:**

- **bson** (^6.10.4): MongoDB BSON library for type definitions

**packages/utils:**

- **clsx** (^2.1.1): Conditional className utility
- **tailwind-merge** (^3.4.0): Tailwind CSS class merging utility

**packages/core:**

- **mongodb** (^7.0.0): MongoDB Node.js driver for connecting and running currentOp
- **lodash-es** (^4.17.22): Utility functions for data manipulation
- **dayjs** (^1.11.19): Date formatting and manipulation
- **chalk** (^5.6.2): Terminal colors and styling
- **geoip-lite** (^1.4.10): IP geolocation lookup
- **humanize-duration** (^3.33.2): Human-readable time formatting
- **config** (^4.1.1): Configuration management

#### Backend Apps

**apps/api:**

- **fastify** (^5.6.2): Fast, low-overhead web framework for the API server
- **@fastify/cors** (^11.2.0): CORS plugin for Fastify

**apps/cli:**

- **cli-table3** (^0.6.5): Beautiful terminal tables for CLI rendering
- **yargs** (^18.0.0): CLI argument parsing
- **window-size** (^1.1.1): Terminal window size detection
- **tsx** (^4.21.0): TypeScript execution for development

#### Frontend (apps/web)

- **react** (^19.2.0): UI library
- **@tanstack/react-router** (^1.132.0): Type-safe routing with file-based routing
- **@tanstack/react-virtual** (^3.13.14): Virtualization for large query lists
- **zustand** (^5.0.9): Lightweight state management for user preferences
- **tailwindcss** (^4.0.6): Utility-first CSS framework
- **shadcn/ui**: Radix UI components styled with Tailwind (Dialog, Select, Table, etc.)
- **@phosphor-icons/react** (^2.1.10): Icon library
- **date-fns** (^4.1.0): Date utilities
- **vite** (^7.1.7): Build tool and dev server

## Code Patterns

### API Server Architecture (apps/api/src/server.ts)

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

### Frontend Architecture (apps/web/src/)

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

- Centralized API client in [apps/web/src/utils/api.ts](apps/web/src/utils/api.ts)
- Axios-based with base URL from `VITE_API_URL` env var (defaults to `http://localhost:9001`)
- API key in headers from `VITE_API_KEY` env var

### Configuration System

Uses the Node.js `config` package that automatically loads and merges YAML files from the `config/` directory:

1. `config/default.yaml` - Default configuration (checked into git)
2. `config/local.yaml` - Local overrides (gitignored)

**Configuration Structure:**

```yaml
# MongoDB Server Configurations
servers:
    server-name:
        name: Display Name
        uri: mongodb://user:pass@host:port/db?options

# API Server Configuration
api:
    port: 9001
    host: 0.0.0.0
    logLevel: info
    apiKey: dev-key-change-in-production
    cors:
        origins:
            - http://localhost:9000
            - http://localhost:3000
        credentials: true

# Frontend Configuration
frontend:
    url: http://localhost:9000
```

**Usage:**

```bash
# CLI with server config
pnpm run dev:cli -- -c server-name

# After building
node dist/cli.js -c server-name
```

**In Code:**

```typescript
import config from "config";

// Get MongoDB servers
const servers = config.get<Record<string, ServerConfig>>("servers");

// Get API settings
const port = config.get<number>("api.port");
const apiKey = config.get<string>("api.apiKey");
```

### Query Processing (packages/core/src/lib/queryProcessor.ts)

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

## Development Guidelines

### Frontend Development

#### Adding New UI Components

**Using shadcn/ui:**

```bash
# Add a new component from shadcn/ui
cd apps/web
npx shadcn@latest add <component-name>

# Example: Add a dropdown menu component
npx shadcn@latest add dropdown-menu
```

Components will be added to `apps/web/src/components/ui/` and can be imported and used immediately.

**Creating Custom Components:**

Follow the existing patterns in `apps/web/src/components/`:

```typescript
// apps/web/src/components/MyComponent.tsx
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

**Backend (apps/api/src/routes/):**

```typescript
// apps/api/src/routes/myroute.ts
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

// Register in apps/api/src/server.ts
await fastify.register(myRoutes, { prefix: "/api/myroute" });
```

**Frontend (apps/web/src/utils/api.ts):**

```typescript
// Add new API function
export const myApi = {
    getData: (id: string, filter?: string) => apiClient.get(`/api/myroute/${id}`, { params: { filter } }),

    postData: (data: string) => apiClient.post("/api/myroute", { data }),
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
// apps/web/src/store/mystore.ts
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

const MyComponent = () => {
    const { count, name, increment, setName } = useMyStore();
    // ...
};
```

### Backend Development

### Adding New Query Filters

**File:** [packages/core/src/lib/queryProcessor.ts](packages/core/src/lib/queryProcessor.ts)

Modify the `shouldSkipQuery()` function:

```typescript
export const shouldSkipQuery = (q: MongoQuery): boolean => {
    // Add your custom filter logic here
    if (q.appName?.match(/YourAppName/i)) {
        return true; // Skip this query
    }

    // Check namespace
    if (q.ns === "admin.$cmd") {
        return true;
    }

    // Check command type
    if (q.command?.yourCommand) {
        return false; // Always show this
    }

    return false;
};
```

### Adding New Server Configuration

**File:** `config/local.yaml`

```yaml
servers:
    my-server:
        name: My Production Server
        uri: mongodb://user:pass@host:27017/dbname?authSource=admin&ssl=true
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

**File:** [packages/core/src/lib/queryProcessor.ts](packages/core/src/lib/queryProcessor.ts), function `sanitizeQuery()`

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

## Running the App

### Quick Start

```bash
pnpm install
pnpm run dev:web  # Runs API + Frontend
```

### Development Modes

```bash
# API + Frontend web UI (most common)
pnpm run dev:web

# API server only
pnpm run dev:api

# CLI only
pnpm run dev:cli
```

### Build and Production

```bash
# Build all packages
pnpm run build

# Run specific app
pnpm run start:api
pnpm run start:cli
```

### Format Code

```bash
pnpm run format
```

Runs Prettier on all TypeScript files across all packages in the monorepo.

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
- **Type Definitions**: Interfaces and types defined in [packages/types/src/](packages/types/src/)
- **Service Pattern**: Business logic encapsulated in service classes in [packages/core/src/services/](packages/core/src/services/)
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
- **Component Prop Ordering**:
    - **Standard order**: callbacks last, className second-to-last
    - **Button components**: `variant/size → disabled → title → className → onClick`
    - **Native button elements**: `className → onClick`
    - **Input components**: `id/type/value → min/max → placeholder → className → onChange`
    - **Select components**: `value → disabled → onValueChange`
    - **className Usage**: Always use `cn()` utility for conditional or variable-based className expressions
    - **Examples**:

        ```typescript
        // Button - correct order
        <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            title="Save Query"
            className="h-6 w-6 border-2"
            onClick={handleSave}
        >
            Save
        </Button>

        // Native button - correct order
        <button
            className="flex items-center gap-1"
            onClick={() => setSortColumn("opid")}
        >
            OP_ID
        </button>

        // Input - correct order
        <Input
            type="number"
            id="minTime"
            value={minTime}
            min={0}
            className="h-9 w-24 border-2"
            onChange={(e) => setMinTime(Number(e.target.value))}
        />

        // className with cn() - conditional styling
        <div
            className={cn(
                "font-mono text-sm",
                isInternal ? "text-muted-foreground/80" : "text-foreground",
            )}
        >
            {value}
        </div>
        ```

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
