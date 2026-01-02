# MongoDB Query Monitor - Frontend

Real-time MongoDB query monitoring dashboard built with Tanstack Start, ShadCN UI, and Server-Sent Events.

## Features

- **Real-time Query Streaming**: Live updates via SSE
- **Query Filtering**: Filter by minimum runtime, IP address
- **Performance Insights**: COLLSCAN detection, query statistics
- **Detailed Query View**: Click any query to see full details
- **Dark Mode**: Built-in theme support
- **Virtualized Table**: High-performance rendering with @tanstack/react-virtual

## Tech Stack

- **Framework**: Tanstack Start (React)
- **UI Library**: ShadCN UI (Radix UI + Tailwind CSS)
- **State Management**: Zustand with localStorage persistence
- **Real-time Updates**: Server-Sent Events (EventSource API)
- **Styling**: Tailwind CSS v4

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm package manager
- Backend API server running on port 9001

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The frontend will start on http://localhost:3000

### Environment Variables

Create a `.env` file:

```bash
VITE_API_KEY=dev-key-change-in-production
VITE_API_URL=http://localhost:9001
```

### Building For Production

```bash
pnpm build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── FilterControls.tsx      # Min time, refresh, IP filter controls
│   │   ├── SummaryStats.tsx        # Query statistics cards
│   │   ├── QueryTable.tsx          # Virtualized query table
│   │   ├── QueryDetails.tsx        # Query detail modal
│   │   └── ui/                     # ShadCN UI components
│   ├── hooks/
│   │   └── useServerSentEvents.ts  # SSE hook for real-time updates
│   ├── store/
│   │   └── preferences.ts          # Zustand state management
│   ├── routes/
│   │   ├── __root.tsx              # Root layout
│   │   └── index.tsx               # Main dashboard
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── utils/
│       └── api.ts                  # API client
└── package.json
```

## Usage

1. Ensure the backend API is running on port 9001
2. Start the frontend dev server
3. Open http://localhost:3000 in your browser
4. The dashboard will automatically connect to MongoDB and stream queries
5. Use filters to adjust minimum query time, refresh interval, or filter by IP
6. Click any query row to see detailed information

## Components

### FilterControls
- Min Time (s): Only show queries running longer than X seconds
- Refresh (s): Update interval for SSE stream
- IP Filter: Filter queries by client IP address
- Show All: Toggle to show/hide system queries
- Reversed: Toggle sort order (longest queries first/last)

### SummaryStats
4-card grid showing:
- Total Queries
- COLLSCAN count (unindexed queries)
- Operations breakdown
- Collections breakdown

### QueryTable
Virtualized table displaying:
- Query ID and index
- Runtime (formatted)
- Operation type
- Namespace (database.collection)
- Client user agent
- Status badges (COLLSCAN, Lock)

### QueryDetails
Modal showing:
- Full query object (formatted JSON)
- Operation details
- Client information with GeoIP location
- COLLSCAN warning if applicable
- Query plan summary

## State Management

Uses Zustand with localStorage persistence for:
- Selected server ID
- Minimum query time
- Refresh interval
- Show all queries toggle
- Reversed sort order
- IP filter

Settings persist across browser sessions.

## Real-time Updates

The dashboard uses Server-Sent Events (SSE) for efficient real-time updates:
- Automatic reconnection on connection loss
- Connection status indicator
- Configurable refresh interval
- No polling overhead

## Styling

Built with ShadCN UI components:
- Accessible by default (Radix UI primitives)
- Neutral color theme
- Dark mode support
- Responsive design
- Tailwind CSS v4
