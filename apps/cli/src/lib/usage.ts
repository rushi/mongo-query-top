//
// Usage instructions for this app
//

import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

interface CliArguments {
    uri?: string;
    ip?: string;
    config: string;
    refresh: number;
    minTime: number;
    all: boolean;
    log: number;
    h?: boolean;
    help?: boolean;
}

const args = yargs(hideBin(process.argv))
    .scriptName("mqt")
    .usage("Usage: $0 --refresh=[num] --minTime=[num] --uri=localhost")
    .option("uri", {
        describe: "MongoDB instance uri",
        type: "string",
    })
    .option("ip", {
        describe: "Only show requests from this IP",
        type: "string",
    })
    .option("config", {
        alias: "c",
        default: "localhost",
        describe: "The server config from config/local.json",
        type: "string",
    })
    .option("refresh", {
        default: 2,
        type: "number",
        describe: "Refresh interval",
    })
    .option("minTime", {
        default: 1,
        type: "number",
        describe: "Min runtime for queries",
    })
    .option("all", {
        default: false,
        type: "boolean",
        describe: "Show all queries without filtering",
    })
    .option("log", {
        default: 10,
        type: "number",
        describe: "Save queries long running queries to disk",
    })
    // .boolean("once")
    // .describe("once", "Run once and quit")
    .help("h")
    .alias("h", "help")
    .epilogue("Show the current operations on a MongoDB instance in an easy to read table")
    .parseSync() as CliArguments;

export default args;
