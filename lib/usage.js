//
// Usage instructions for this app
//
export default require('yargs')
    .usage('Show the current operations on a MongoDB instance in an easy to read table\n\nUsage: $0 --interval=[num]')
    .default('uri')
    .default('config', 'localhost')
    .default('interval', 2)
    .default('minTime', 0)
    .boolean('once')
    .alias('c', 'config')
    .alias('i', 'interval')
    .alias('t', 'minTime')
    .help('h')
    .alias('h', 'help')
    .describe('uri', 'MongoDB instance uri')
    .describe('config', 'Name of the configuration to use from the config folder')
    .describe('interval', 'Refresh data every X second')
    .describe('minTime', 'Only show queries with a run time longer than this value')
    .describe('once', 'Run once and quit')
    .argv;
