//
// Usage instructions for this app
//

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const args = yargs(hideBin(process.argv))
    .scriptName("mqt")
    .usage("Usage: $0 --refresh=[num] --minTime=[num] --uri=localhost")
    .option("uri", {
        describe: "MongoDB instance uri"
    })
    .option("ip", {
        describe: "Only show requests from this IP"
    })
    .option("config", {
        alias: "c",
        default: "localhost",
        describe: "The server config from config/local.json"
    })
    .option("refresh", {
        default: 2,
        type: "number",
        describe: "Refresh interval"
    })
    .option("minTime", {
        default: 1,
        type: "number",
        describe: "Min runtime for queries"
    })
    .option("all", {
        default: false,
        type: "boolean",
        describe: "Show all queries without filtering"
    })
    .option("log", {
        default: 1,
        type: "number",
        describe: "Save queries long running queries to disk"
    })
    // .boolean("once")
    // .describe("once", "Run once and quit")
    .help("h")
    .alias("h", "help")
    .epilogue("Show the current operations on a MongoDB instance in an easy to read table").argv;

export default args;
