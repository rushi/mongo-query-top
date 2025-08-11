#!/usr/bin/env node

import _ from "lodash";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import config from "config";
import args from "./lib/usage.js";
import AsciiRenderer from "./lib/asciiRenderer.js";
import ApiServer from "./lib/apiServer.js";
import { sleep, clear, setupRawMode, cleanupAndExit } from "./lib/helpers.js";

const prefs = {
    paused: false,
    reversed: false,
    snapshot: false,
    refreshInterval: Number(args.refresh),
    minTime: Number(args.minTime),
    all: args.all,
    log: args.log,
};

let server;
let db;

async function run() {
    const serverConfig = config.get(args.config);
    prefs.ip = args.ip;

    try {
        console.log(chalk.blue(`Connecting to MongoDB URI...`));
        server = await MongoClient.connect(serverConfig.uri);
        db = server.db("admin");
    } catch (err) {
        console.log(chalk.red(`Error connecting to MongoDB URI: ${serverConfig.uri}`));
        console.log(chalk.white.bgRed(err));
        cleanupAndExit();
    }

    try {
        if (args.api) {
            // Run in API mode
            console.log(chalk.green("Connected to database. Starting app in API mode"));
            const apiServer = new ApiServer(db, prefs, args.config);
            await apiServer.start(args.port);

            // Keep the process running
            process.on("SIGINT", () => {
                console.log(chalk.yellow("\nShutting down API server..."));
                cleanupAndExit();
            });
        } else {
            // Run in CLI mode (original behavior)
            setupRawMode(prefs);
            const renderer = new AsciiRenderer(prefs, args.config);
            let body;

            while (true) {
                let queries, serverStatus;
                if (!prefs.paused) {
                    // Fetch current operations and server status in parallel
                    [queries, serverStatus] = await Promise.all([
                        db.command({ currentOp: 1, secs_running: { $gte: Number(prefs.minTime) } }),
                        db.command({ serverStatus: 1 })
                    ]);
                    body = renderer.renderBody(queries.inprog);
                }

                const header = renderer.renderHeader(serverStatus?.connections);

                if (!prefs.paused || !prefs.finishedPausing) {
                    clear();
                    console.log(header, body);
                    prefs.finishedPausing = prefs.paused;
                }

                if (args.once) {
                    break;
                }

                const interval = prefs.paused ? 0.5 : prefs.refreshInterval;
                await sleep(interval);

                if (prefs.snapshot && queries) {
                    // User requested to save a snapshot of the current queries to disk for later analysis
                    renderer.save(queries.inprog);
                }
            }
        }
    } catch (err) {
        console.log(chalk.white.bgRed(`Error running db.currentOp(): ${err}`));
        console.log(err);
        cleanupAndExit();
    }

    if (!args.api) {
        cleanupAndExit();
    }
}

process.on("exit", () => {
    console.log("Closing server connection");
    server?.close();
});

run(); // Start
