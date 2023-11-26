//
// Usage instructions for this app
//

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const args = yargs(hideBin(process.argv))
    .usage("Usage: $0 --refresh=[num] --minTime=[num]")
    .default("uri")
    .describe("uri", "MongoDB instance uri")
    .default("ip")
    .describe("ip", "Only show requests from this IP")
    .alias("c", "config")
    .default("config", "localhost")
    .describe("config", "Name of the configuration to use from the config folder")
    .default("refresh", 2)
    .describe("refresh", "Refresh data every X seconds")
    .default("minTime", 1)
    .describe("minTime", "Only show queries with a run time longer than this value")
    .boolean("all")
    .default("all", false)
    .describe("all", "Should all queries, do not filter anything")
    .boolean("once")
    .describe("once", "Run once and quit")
    .help("h")
    .alias("h", "help")
    .epilogue("Show the current operations on a MongoDB instance in an easy to read table").argv;

export default args;
