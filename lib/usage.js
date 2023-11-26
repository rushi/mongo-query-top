//
// Usage instructions for this app
//

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const args = yargs(hideBin(process.argv))
    .usage('Show the current operations on a MongoDB instance in an easy to read table\n\nUsage: $0 --interval=[num]')
    .default('uri')
    .default('ip')
    .default('config', 'localhost')
    .default('refresh', 2)
    .default('minTime', 1)
    .boolean('once')
    .alias('c', 'config')
    .alias('i', 'refresh')
    .alias('t', 'minTime')
    .help('h')
    .alias('h', 'help')
    .describe('uri', 'MongoDB instance uri')
    .describe('config', 'Name of the configuration to use from the config folder')
    .describe('interval', 'Refresh data every X seconds')
    .describe('minTime', 'Only show queries with a run time longer than this value')
    .describe('once', 'Run once and quit')
    .describe('ip', 'Only show requests from this IP').argv;

export default args;
