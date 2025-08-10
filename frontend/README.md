# MongoDB Query Top - Frontend

A modern React web interface for monitoring MongoDB operations in real-time. Built with Next.js, React 19, and shadcn/ui components.

## Features

-   **Real-time Monitoring**: Auto-refreshing dashboard showing current MongoDB operations
-   **Modern UI**: Clean, responsive interface built with shadcn/ui components
-   **Query Details**: Detailed view of individual queries with formatted JSON
-   **Collection Scan Detection**: Highlights unindexed queries with visual warnings
-   **Query Management**: Kill long-running queries directly from the interface
-   **Geographic Information**: Shows client location information when available
-   **Snapshot Saving**: Save current query state for later analysis
-   **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

-   Node.js 18+
-   MongoDB Query Top API server running (see parent directory)

## Quick Start

1. **Install Dependencies**

    ```bash
    cd frontend
    npm install
    ```

2. **Start Development Server**

    ```bash
    npm run dev
    ```

3. **Start the API Server** (in parent directory)

    ```bash
    cd ..
    ./app.js --api --port 3000
    ```

4. **Open Browser**
    ```
    http://localhost:3001
    ```

## Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run start` - Start production server
-   `npm run lint` - Run ESLint

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
# MongoDB Query Top API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Development mode
NODE_ENV=development
```

### API Proxy

The Next.js app proxies API requests to avoid CORS issues:

-   Frontend: `http://localhost:3001`
-   API calls: `http://localhost:3001/api/mongo/*` → `http://localhost:3000/api/*`

## UI Components

Built using shadcn/ui components:

-   **Cards**: Display summary statistics and query information
-   **Tables**: Show active queries with sortable columns
-   **Badges**: Highlight query status and warnings
-   **Buttons**: Interactive controls for actions
-   **Typography**: Consistent text styling

## Key Features

### Dashboard Overview

-   Server connection status
-   Query count summaries
-   Collection scan warnings
-   Operation type breakdowns
-   Namespace usage statistics

### Query Table

-   Real-time query listing
-   Runtime highlighting (red for slow queries)
-   Collection scan warnings (yellow highlighting)
-   Client IP and geographic location
-   User agent identification
-   Plan summary information

### Query Details

-   Formatted JSON display
-   Complete query information
-   Client connection details
-   Performance metrics

### Controls

-   Pause/resume auto-refresh
-   Manual refresh button
-   Save snapshots
-   Kill individual queries
-   Adjustable refresh intervals

## API Integration

The frontend consumes the MongoDB Query Top REST API:

-   `GET /api/currentop` - Fetch current operations
-   `GET /api/info` - Get server information
-   `POST /api/preferences` - Update monitoring settings
-   `POST /api/snapshot` - Save query snapshot
-   `DELETE /api/killOp/:opid` - Kill specific operation

## Development

### Tech Stack

-   **Framework**: Next.js 15 with App Router
-   **React**: React 19 (latest)
-   **Styling**: Tailwind CSS
-   **UI Library**: shadcn/ui
-   **Icons**: Lucide React
-   **TypeScript**: Full type safety

### Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   ├── ui/              # shadcn/ui components
│   └── Dashboard.tsx    # Main dashboard component
└── lib/
    ├── api.ts           # API service layer
    ├── types.ts         # TypeScript definitions
    └── utils.ts         # Utility functions
```

### Adding New Features

1. **New API Endpoints**: Update `src/lib/api.ts`
2. **UI Components**: Add to `src/components/ui/`
3. **Type Definitions**: Update `src/lib/types.ts`
4. **Dashboard Features**: Modify `src/components/Dashboard.tsx`

## Production Deployment

1. **Build the application**

    ```bash
    npm run build
    ```

2. **Start production server**

    ```bash
    npm start
    ```

3. **Environment Configuration**
   Update API URL in production environment variables.

## Browser Support

-   Chrome/Edge 90+
-   Firefox 88+
-   Safari 14+
-   Mobile browsers with ES2020 support

## Contributing

1. Follow existing code style and patterns
2. Add TypeScript types for new features
3. Test on multiple screen sizes
4. Ensure accessibility compliance
5. Update documentation for new features
