# CLI Usage Guide

The MongoDB Query Top CLI provides a terminal-based monitoring interface similar to the Unix `top` command.

## Quick Start

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

## Command Line Options

```
--config, -c    Server config name from config/ (default: "localhost")
--refresh       Refresh interval in seconds (default: 2)
--minTime       Min query runtime to show in seconds (default: 1)
--all           Show system/internal queries (default: false)
--log           Auto-save queries longer than X seconds (default: 10)
--ip            Filter by client IP address
--help, -h      Show help
```

### Examples

```bash
# Basic usage with localhost
pnpm run dev:cli

# Connect to different server from config
pnpm run dev:cli -- -c m01

# Show fast queries with quick refresh
pnpm run dev:cli -- --minTime=0 --refresh=1

# Log queries longer than 5 seconds
pnpm run dev:cli -- --log=5

# Filter by IP address
pnpm run dev:cli -- --ip=192.168.1.100

# Show all queries including system queries
pnpm run dev:cli -- --all

# Production usage (after build)
node dist/cli.js -c prod --minTime=2
```

## Interactive Controls

While the CLI is running, you can use these keyboard shortcuts:

| Key             | Action                                                          |
| --------------- | --------------------------------------------------------------- |
| `p`             | Pause/unpause fetching and rendering                            |
| `r`             | Reverse sort order (shortest queries at top instead of longest) |
| `s`             | Save snapshot of current queries to disk                        |
| `a`             | Toggle showing all queries (including system queries)           |
| `q` or `Ctrl+C` | Quit the application                                            |

## Display Features

### Color Highlighting

- **Yellow/Red** - Queries using COLLSCAN (collection scan without index)
- **Bold** - Long-running queries exceeding the log threshold

### Query Information

Each row displays:

- **#** - Row number
- **Operation ID** - MongoDB operation identifier
- **Age** - How long the query has been running (human-readable format)
- **Operation/Namespace** - Query type and database.collection
- **Query** - Formatted query details including:
    - Client information (Mongoose, PHP, NoSQLBooster, etc.)
    - GeoIP location for public IPs
    - Plan summary (IXSCAN, COLLSCAN, etc.)
    - Query filter details

### Summary Statistics

At the bottom of the display:

- Total number of operations
- Number of unique collections queried
- Number of unique client IPs
- Count of unindexed queries (COLLSCAN)

## Query Logging

Queries are automatically saved to `logs/<server-id>/` when:

1. **Runtime exceeds `--log` threshold** (default: 10 seconds)
2. **Query uses COLLSCAN** (collection scan without index)
3. **User presses `s`** (manual snapshot)

### Log File Structure

```
logs/
└── <server-id>/
    ├── raw/
    │   └── query-<opid>-<collection>-<type>-raw.json
    └── query-<opid>-<collection>-<type>-sanitized.json
```

### Snapshot Files (triggered by `s` key)

```
logs/
└── <server-id>/
    ├── queries-raw-<timestamp>.json
    └── queries-sanitized-<timestamp>.json
```

## Configuration

The CLI reads server configurations from YAML files in `config/`:

**config/default.yaml** (checked into git):

```yaml
servers:
    localhost:
        name: Local MongoDB
        uri: mongodb://localhost:27017
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
```

Copy `config/local.yaml.example` to get started.

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to MongoDB

**Solution:**

- Check your `config/local.yaml` URI format and network access
- Verify MongoDB server is running and accessible
- Check firewall rules and authentication credentials
- Test connection with MongoDB Compass or `mongosh`

### Terminal Display Issues

**Problem:** Colors not showing or garbled output

**Solution:** Ensure terminal supports ANSI colors. Try different terminal emulator (iTerm2, Hyper, Windows Terminal).

### Performance Issues

**Problem:** CLI lags with many queries

**Solution:**

- Increase `--minTime` to filter out fast queries
- Increase `--refresh` interval
- Use `--ip` to filter by specific client

## Production Usage

```bash
# Build the project first
pnpm run build

# Monitor production server
node dist/cli.js -c prod --minTime=2 --refresh=5

# Save all long queries for analysis
node dist/cli.js -c prod --log=3 --minTime=0

# Focus on specific IP
node dist/cli.js -c prod --ip=10.0.1.50

# Quick diagnosis - show everything
node dist/cli.js -c prod --all --minTime=0 --refresh=1
```

## Advanced Usage

### Custom Filters

Combine multiple options for advanced filtering:

```bash
# Show all queries from specific IP, refresh every 3 seconds
pnpm run dev:cli -- --ip=192.168.1.100 --all --refresh=3

# Log aggressive - save anything over 2 seconds, show all
pnpm run dev:cli -- --log=2 --all --minTime=0

# Focus on slow queries only, large refresh interval
pnpm run dev:cli -- --minTime=10 --refresh=10
```

### Integration with Scripts

```bash
# Run for 60 seconds then exit (using timeout)
timeout 60 node dist/cli.js -c prod

# Redirect output to file (note: colors will be stripped)
node dist/cli.js -c prod 2>&1 | tee output.log
```

## See Also

- **[API.md](API.md)** - REST API documentation
- **[../CLAUDE.md](../CLAUDE.md)** - Developer guide and customization
- **[../README.md](../README.md)** - Project overview
