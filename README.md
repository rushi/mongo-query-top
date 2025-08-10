# MongoDB Query "Top"

This app aims to be a unix-like "top" experience for MongoDB's running queries. The app presents the results of `db.currentOp();` in a tabular fashion for your MongoDB instances. It can run as either a **CLI tool** (default) or as a **REST API server** for integration with other tools.

## Features

- **CLI Mode**: Real-time terminal interface similar to unix `top`
- **API Mode**: RESTful HTTP API returning JSON responses  
- **Web UI**: Modern React dashboard for monitoring queries in a browser
- Filter out system/replication queries for cleaner output
- Auto-refresh every X seconds with customizable intervals
- Identify slow queries, collection scans, and query sources
- Kill long-running queries directly from the interface
- Save snapshots to disk for later analysis
- GeoIP lookup for client locations

## Why?

You could read the output of `db.currentOp()`, but:

- The output is in JSON, and while it is programmer friendly, it's long vertical output isn't easily readable for human eyes.
- The output is literred with system & replication queries which you may have to ignore.
- There is no way to auto-refresh it every X seconds and present a summary.

Other reasons for a dev ops engineer or a developer:

- Figure out quickly who is behind that long running query
- Who or what is doing un-indexed collection scans.
- How many queries are running on the server and what's their source
- Integrate MongoDB query monitoring into dashboards and alerting systems

## Quick Start

### CLI Mode (Default)
```bash
npm install
./app.js  # Monitor localhost MongoDB
```

### API Mode  
```bash
npm install
npm run api  # Start API server on port 3000
curl http://localhost:3000/api/currentop  # Get current operations as JSON
```

## Installation & Usage

### CLI Mode
This will start the app against the `localhost` server configured in `config/default.json`.

- `npm install`
- `./app.js` (same as `node app.js -c localhost`)

To run this against your own set of servers:

- Create a file `config/local.json` and define servers in it as indicated in `config/default.json`. You just need the URIs.
- Start the app using `./app.js -c <server-name>`

### API Mode  
Start the API server:
```bash
# Default settings (port 3000)  
./app.js --api

# Custom port and config
./app.js --api --port 4000 --config production --minTime 2
```

### Web UI Mode
Start both the API server and the React frontend:
```bash
# Terminal 1: Start API server
./app.js --api

# Terminal 2: Start React frontend  
cd frontend
npm install
npm run dev
```

Then open http://localhost:3001 in your browser.

See [API_USAGE.md](API_USAGE.md) for detailed API documentation and [frontend/README.md](frontend/README.md) for React app details.

More details can be obtained by passing the `-h` flag.

```
Usage: mqt --refresh=[num] --minTime=[num] --uri=localhost

Options:
      --version       Show version number                              [boolean]
  -h, --help          Show help                                        [boolean]
      --uri           MongoDB instance uri
      --ip            Only show requests from this IP
  -c, --config        The server config from config/local.json
                                                        [default: "localhost"]
      --refresh       Refresh interval                   [number] [default: 2]
      --minTime       Min runtime for queries            [number] [default: 1]
      --all           Show all queries without filtering
                                                       [boolean] [default: false]
      --log           Save queries long running queries to disk
                                                        [number] [default: 10]
      --api           Run as API server instead of CLI interface
                                                       [boolean] [default: false]
      --port          Port for API server (only used with --api)
                                                       [number] [default: 3000]

Show the current operations on a MongoDB instance in an easy to read table
```

### Commands

While the app is running you can press the following keys to execute special functions:

- `p` - Pause fetching and rendering of queries
- `r` - Reverse the sorting of the queries (Default: Longest running at the bottom for easy diagnosis)
- `s` - Save a JSON snapshot of the current queries to disk as `.json` file for later review

## Requirements

- NodeJS >= 12
- MongoDB version > 3.6

## Author

- [Rushi Vishavadia](https://github.com/rushi)

## License

MIT
