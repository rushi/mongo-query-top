//
// Usage instructions for this app
//
module.exports = require('yargs')
      .usage("Show the current operations on a MongoDB instance in an easy to read table\n\nUsage: $0 --interval=[num] --watch")
      .default('uri', 'mongodb://127.0.0.1:27017')
      .default('watch', false)
      .boolean('watch')
      .default('interval', 1)
      .alias('i', 'interval')
      .help('h')
      .alias('h', 'help')
      .describe('uri', 'MongoDB instance uri')
      .describe('watch', 'Keep watching for change in queries')
      .describe('interval', 'Refresh data every X second')
      .argv;
