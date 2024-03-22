#!/usr/bin/env node

import _ from "lodash";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import config from "config";
import args from "./lib/usage.js";
import Renderer from "./lib/renderer.js";
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
    setupRawMode(prefs);
    prefs.ip = args.ip;

    try {
        server = await MongoClient.connect(serverConfig.uri);
        db = server.db("admin");
    } catch (err) {
        console.log(chalk.red(`Error connecting to MongoDB URI: ${args.uri}`));
        console.log(chalk.white.bgRed(err));
        cleanupAndExit();
    }

    try {
        const renderer = new Renderer(prefs, args.config);
        let body;
        while (true) {
            const header = renderer.renderHeader();
            let queries;
            if (!prefs.paused) {
                queries = await db.command({ currentOp: 1, secs_running: { $gte: Number(prefs.minTime) } });
                body = renderer.renderBody(queries.inprog);
            }

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
    } catch (err) {
        console.log(chalk.white.bgRed(`Error running db.currentOp(): ${err}`));
        console.log(err);
    }

    cleanupAndExit();
}

process.on("exit", () => {
    console.log("Closing server connection");
    server?.close();
});

run(); // Start
