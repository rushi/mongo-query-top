//
// Usage instructions for this app
//

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const args = yargs(hideBin(process.argv))
    .usage("Usage: $0 --refresh=[num] --minTime=[num]")
    .default("uri")
    .default("ip")
    .default("config", "localhost")
    .default("refresh", 2)
    .default("minTime", 1)
    .default("all", false)
    .boolean("once")
    .boolean("all")
    .alias("c", "config")
    .alias("i", "refresh")
    .alias("t", "minTime")
    .help("h")
    .alias("h", "help")
    .describe("uri", "MongoDB instance uri")
    .describe("config", "Name of the configuration to use from the config folder")
    .describe("refresh", "Refresh data every X seconds")
    .describe("minTime", "Only show queries with a run time longer than this value")
    .describe("once", "Run once and quit")
    .describe("ip", "Only show requests from this IP")
    .describe("all", "Should all queries, do not filter anything")
    .epilogue("Show the current operations on a MongoDB instance in an easy to read table").argv;

export default args;
