# MongoDB Query "Top"

This app aims to be a unix-like "top" experience for MongoDB's running queries. The app presents the results of `db.currentOp();` in a tabular fashion for your MongoDB instances. This is built using NodeJS, so it's got it's share of quirks and isn't as slick as top but it is easily hackable for any dev who knows JavaScript.

## Why?

You could read the output of `db.currentOp()`, but:
* The output is in JSON, and while it is programmer friendly, it's long vertical output isn't easily readable for human eyes.
* The output is literred with system & replication queries which you may have to ignore. 
* There is no way to auto-refresh it every X seconds and present a summary.

Other reasons for a dev ops engineer or a developer:
* Figure out quickly who is behind that long running query
* Who or what is doing un-indexed collection scans.
* How many queries are running on the server and what's their source

## How To

This will start the app against the `localhost` server configured in `config/default.json`.
* `npm install`
* `node main.js` (same as `node main.js -c localhost`)

To run this against your own set of servers:
* Create a file `config/local.json` and define servers in it as indicated in `config/default.json`. You just need the URIs.
* Start the app using `node main.js -c <server-name>`

More details can be obtained by passing the `-h` flag. 
```
§ node main.js -h
Show the current operations on a MongoDB instance in an easy to read table

Usage: main.js --interval=[num]

Options:
  -h, --help      Show help                                            [boolean]
  --uri           MongoDB instance uri
  --watch         Keep watching for change in queries  [boolean] [default: true]
  -i, --interval  Refresh data every X second                       [default: 2]
  -c, --config    Name of the configuration to use from the config folder
                                                          [default: "localhost"]
```

## Requirements

* NodeJS > v8.0

## Author

* [Rushi Vishavadia](https://github.com/rushi)

## License

MIT