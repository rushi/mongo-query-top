# MongoDB Query Top - API Usage Examples

This document shows how to use the MongoDB Query Top tool in API mode.

## Starting the API Server

```bash
# Start with default settings (port 3000)
npm run api

# Or use command line options
./app.js --api --port 4000 --config production --minTime 2

# Or with specific MongoDB connection
./app.js --api --config localhost --refresh 5 --minTime 1
```

## API Endpoints

### 1. Get Current Operations
```bash
# Get all current operations
curl http://localhost:3000/api/currentop

# Get operations with custom minimum time
curl "http://localhost:3000/api/currentop?minTime=5"
```

### 2. Get Server Information  
```bash
curl http://localhost:3000/api/info
```

### 3. Update Monitoring Preferences
```bash
curl -X POST http://localhost:3000/api/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "refreshInterval": 3,
    "minTime": 2,
    "all": true,
    "paused": false
  }'
```

### 4. Save Snapshot
```bash
curl -X POST http://localhost:3000/api/snapshot
```

### 5. Health Check
```bash
curl http://localhost:3000/health
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "metadata": {
    "server": "localhost",
    "refreshInterval": 2,
    "minTime": 1,
    "timestamp": "2025-08-10T21:49:18.000Z",
    "paused": false,
    "reversed": false,
    "showAll": false,
    "message": null
  },
  "data": {
    "queries": [
      {
        "index": 1,
        "opid": "12345",
        "runTime": 2.5,
        "runTimeFormatted": "2.5s", 
        "operation": "find",
        "namespace": "mydb.users",
        "query": { "name": "john" },
        "planSummary": "IXSCAN",
        "isCollectionScan": false,
        "waitingForLock": false,
        "message": null,
        "client": {
          "ip": "192.168.1.100",
          "location": {
            "city": "San Francisco",
            "region": "CA", 
            "country": "US"
          }
        },
        "userAgent": "Node.js v18",
        "effectiveUsers": null
      }
    ],
    "summary": {
      "totalQueries": 10,
      "displayedQueries": 5,
      "skippedQueries": 5,
      "unindexedQueries": 2,
      "operations": { "find": 3, "update": 2 },
      "namespaces": { "mydb.users": 4, "mydb.orders": 1 },
      "userAgents": { "Node.js v18": 3, "PHP ext-mongodb": 2 }
    }
  },
  "timestamp": "2025-08-10T21:49:18.123Z"
}
```

## Integration Examples

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/api/currentop');
const data = await response.json();

if (data.success) {
  console.log(`Found ${data.data.queries.length} active queries`);
  data.data.queries.forEach(query => {
    console.log(`Query ${query.opid}: ${query.runTimeFormatted} - ${query.namespace}`);
  });
}
```

### Python
```python
import requests

response = requests.get('http://localhost:3000/api/currentop')
data = response.json()

if data['success']:
    for query in data['data']['queries']:
        print(f"Query {query['opid']}: {query['runTimeFormatted']} - {query['namespace']}")
```

### curl with jq for pretty output
```bash
curl -s http://localhost:3000/api/currentop | jq '.data.queries[] | {opid, runTime, namespace, operation}'
```

## Configuration

The API server respects the same configuration files as the CLI version:
- `config/default.json` 
- `config/local.json`

Example config:
```json
{
  "localhost": {
    "uri": "mongodb://localhost:27017"
  },
  "production": {
    "uri": "mongodb://prod-server:27017/admin"
  }
}
```
