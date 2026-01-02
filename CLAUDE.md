# MongoDB Query Top - Developer Guide

## Application Overview

**mongo-query-top** is a CLI monitoring tool that displays MongoDB's current operations in a human-friendly tabular format, similar to the Unix `top` command. It provides real-time visibility into database query activity with color-coded highlighting, filtering, and automatic logging of problematic queries.

### Key Features
- Real-time auto-refresh with configurable intervals
- Intelligent filtering of system/internal queries
- Highlights unindexed queries (COLLSCAN) in yellow
- GeoIP location display for public IP addresses
- Auto-saves long-running and problematic queries to disk
- Detects and formats various MongoDB clients (Mongoose, PHP, NoSQLBooster, etc.)
- Interactive keyboard controls (pause, reverse, snapshot, show all)
- Summary statistics (operations, collections, clients, unindexed queries)

### Use Cases
- Find long-running queries consuming resources
- Detect unindexed collection scans
- Monitor query sources (which clients/IPs are hitting the database)
- Debug database performance issues in real-time
- Save snapshots of query patterns for later analysis

## Architecture

### File Structure
```
├── app.js                      # Main entry point - MongoDB connection & render loop
├── lib/
│   ├── helpers.js             # Utilities: sleep, clear, raw mode, JSON formatting
│   ├── queryProcessor.js      # Query filtering, sanitization, user agent detection
│   ├── renderer.js            # Table rendering with cli-table3, GeoIP, logging
│   └── usage.js               # CLI argument parsing with yargs
├── config/
│   ├── default.json           # Default MongoDB URIs (localhost)
│   └── local.json             # User-specific MongoDB URIs (gitignored)
├── logs/                      # Auto-saved query snapshots (gitignored)
│   └── <config-name>/
│       ├── raw/               # Full raw query objects
│       └── *.json             # Sanitized query snapshots
└── package.json
```

### Key Dependencies
- **mongodb** (^6.3.0): MongoDB Node.js driver for connecting and running currentOp
- **cli-table3** (^0.6.3): Beautiful terminal tables
- **chalk** (^5.3.0): Terminal colors and styling
- **lodash** (^4.17.21): Utility functions for data manipulation
- **yargs** (^17.7.2): CLI argument parsing
- **config** (^3.3.9): Configuration file management
- **dayjs** (^1.11.10): Date formatting
- **geoip-lite** (^1.4.8): IP geolocation lookup
- **humanize-duration** (^3.31.0): Human-readable time formatting

## Code Patterns

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
./app.js -c server-name
```

### Main Loop (app.js)
1. Connect to MongoDB using configured URI
2. Setup raw mode for keyboard input handling
3. Main loop:
   - Fetch `db.currentOp()` with `secs_running >= minTime` filter
   - Render header and table body
   - Sleep for refresh interval
   - Handle keyboard inputs
4. Exit on `q` or `Ctrl+C`

### Query Processing (lib/queryProcessor.js)

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

### Rendering (lib/renderer.js)

**`renderHeader()`**
- Shows: server name, refresh interval, minTime, current time, window size
- Indicates status: (paused), (reverse), showing all queries
- Displays feedback messages (e.g., "Wrote query X to disk")

**`renderBody(queries)`**
- Sorts queries by run time (longest at bottom for easy diagnosis)
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

### Helper Functions (lib/helpers.js)

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
| `r` | Reverse sort order (longest queries at top instead of bottom) |
| `s` | Save snapshot of current queries to disk |
| `a` | Toggle showing all queries (including system queries) |
| `q` or `Ctrl+C` | Quit the application |

## CLI Arguments

```bash
./app.js [options]

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
./app.js

# Connect to different server
./app.js -c m01

# Show fast queries with quick refresh
./app.js --minTime=0 --refresh=1

# Log queries longer than 5 seconds
./app.js --log=5

# Filter by IP address
./app.js --ip=192.168.1.100

# Show all queries including system queries
./app.js --all
```

## Development Guidelines

### Adding New Query Filters

**File:** `lib/queryProcessor.js`

Modify the `shouldSkipQuery()` function:

```javascript
export function shouldSkipQuery(q) {
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
}
```

### Customizing Table Display

**File:** `lib/renderer.js`

**Adjust Column Widths:**
```javascript
// Line 59
const colWidths = [5, 25, 9, 25];  // Modify these values
```

**Add New Column:**
```javascript
// In renderBody(), around line 165
table.push([row.idx, row.opid, row.time, row.op, query, newColumn]);
```

**Change Color Highlighting:**
```javascript
// Around line 151-154
if (row.q.planSummary && row.q.planSummary === "COLLSCAN") {
    query = c.red(query);  // Change from yellow to red
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
./app.js -c my-server
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

**File:** `lib/queryProcessor.js`, function `formatUserAgent()`

```javascript
export function formatUserAgent(q) {
    const { appName, clientMetadata } = q;

    // Add your custom client detection
    if (clientMetadata?.driver?.name?.match(/YourDriver/i)) {
        return chalk.bold("Your Custom Driver");
    }

    if (appName?.match(/YourApp/i)) {
        return "Your App Name";
    }

    // ... existing code
}
```

### Modifying Query Sanitization

**File:** `lib/queryProcessor.js`, function `sanitizeQuery()`

**Hide Additional Fields:**
```javascript
let query = _.omit(q, [
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

**File:** `lib/usage.js`
```javascript
// Line 22-26
.option("refresh", {
    default: 5,  // Change from 2 to 5 seconds
    type: "number",
    describe: "Refresh interval",
})
```

### Change Default Minimum Query Time

**File:** `lib/usage.js`
```javascript
// Line 27-31
.option("minTime", {
    default: 0,  // Change from 1 to 0 to see all queries
    type: "number",
    describe: "Min runtime for queries",
})
```

### Disable Auto-Logging

**File:** `lib/usage.js`
```javascript
// Line 37-41
.option("log", {
    default: Infinity,  // Change to Infinity to disable auto-logging
    type: "number",
    describe: "Save queries long running queries to disk",
})
```

Or pass `--log=999999` when running.

### Change Sort Order Default

**File:** `app.js`
```javascript
// Line 11-19
const prefs = {
    paused: false,
    reversed: true,  // Change to true to show longest queries at top by default
    // ...
};
```

## Running the App

### Quick Start
```bash
npm install
./app.js
```

### Development with Auto-Restart
```bash
npm run dev
```
Uses `node --watch` to restart on file changes.

### Format Code
```bash
npm run format
```
Runs Prettier on all files.

### Production Usage
```bash
# Monitor production server
./app.js -c prod --minTime=2 --refresh=5

# Save all long queries for analysis
./app.js -c prod --log=3 --minTime=0

# Focus on specific IP
./app.js -c prod --ip=10.0.1.50

# Quick diagnosis - show everything
./app.js -c prod --all --minTime=0 --refresh=1
```

## Code Style

- **ES Modules**: Uses `import`/`export` (requires Node.js >= 12)
- **Lodash**: Extensively used for data manipulation (`_.sortBy`, `_.omit`, `_.each`, etc.)
- **Arrow Functions**: Preferred for all functions
- **Async/Await**: Used for MongoDB operations
- **Chalk**: Terminal colors throughout
- **No TypeScript**: Plain JavaScript

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to MongoDB
**Solution:** Check your `config/local.json` URI format and network access

### Terminal Display Issues

**Problem:** Colors not showing or garbled output
**Solution:** Ensure terminal supports ANSI colors. Try different terminal emulator.

### Raw Mode Issues

**Problem:** Keys not responding
**Solution:** Terminal must support raw mode. Check if stdin is a TTY.

### Performance Issues

**Problem:** App lags with many queries
**Solution:**
- Increase `--minTime` to filter out fast queries
- Increase `--refresh` interval
- Use `--ip` to filter by specific client

## Future Enhancement Ideas

- Add keyboard shortcuts for adjusting minTime/refresh on the fly
- Export to different formats (CSV, markdown, HTML)
- Better visualizations for lock contention
- Query explain plan integration and visualization
- Historical trending of query patterns with charts
- Terminal UI framework (blessed, ink) for better interactivity
- WebSocket/HTTP server mode for remote monitoring
- Add tests (currently no test suite)
- Add query kill functionality (with confirmation)
- Add filtering by operation type, collection, or user
- Alerting for specific query patterns
- Integration with monitoring tools (Datadog, New Relic)

## Resources

- [MongoDB currentOp Documentation](https://www.mongodb.com/docs/manual/reference/method/db.currentOp/)
- [MongoDB Profiler](https://www.mongodb.com/docs/manual/tutorial/manage-the-database-profiler/)
- [cli-table3 Documentation](https://github.com/cli-table/cli-table3)
- [chalk Documentation](https://github.com/chalk/chalk)
