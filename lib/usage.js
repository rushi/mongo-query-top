//
// Usage instructions for this app
//
module.exports = require('yargs')
      .usage("Show the current operations on a MongoDB instance in an easy to read table\n\nUsage: $0 --interval=[num]")
      .default('uri')
      .default('config', 'localhost')
      .default('interval', 2)
      .alias('i', 'interval')
      .alias('c', 'config')
      .help('h')
      .alias('h', 'help')
      .describe('config', 'Name of the configuration to use from the config folder')
      .describe('uri', 'MongoDB instance uri')      
      .describe('interval', 'Refresh data every X second')
      .argv;
