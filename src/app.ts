#!/usr/bin/env node

import { MongoClient, Db } from "mongodb";
import chalk from "chalk";
import args from "./lib/usage.js";
import Renderer from "./lib/renderer.js";
import { sleep, clear, setupRawMode, cleanupAndExit } from "./lib/helpers.js";
import type { UserPreferences, ServerConfig } from "./types/index.js";

// Import config files using JSON imports (replaces config package)
import defaultConfig from "./config/default.json" with { type: "json" };

// Try to import local config, fall back to empty object if it doesn't exist
let localConfig: Record<string, ServerConfig> = {};
try {
    localConfig = await import("./config/local.json", { with: { type: "json" } }).then(m => m.default);
} catch {
    // local.json doesn't exist, that's okay
}

const servers: Record<string, ServerConfig> = { ...defaultConfig, ...localConfig };

const prefs: UserPreferences = {
    paused: false,
    reversed: false,
    snapshot: false,
    refreshInterval: Number(args.refresh),
    minTime: Number(args.minTime),
    all: args.all,
    log: args.log,
    ip: args.ip,
    finishedPausing: false,
};

let server: MongoClient | undefined;
let db: Db | undefined;

async function run() {
    const serverConfig = servers[args.config];

    if (!serverConfig) {
        console.log(chalk.red(`Server config "${args.config}" not found in config files`));
        console.log(chalk.yellow(`Available configs: ${Object.keys(servers).join(", ")}`));
        cleanupAndExit();
    }

    setupRawMode(prefs);

    try {
        server = await MongoClient.connect(serverConfig.uri);
        db = server.db("admin");
    } catch (err) {
        console.log(chalk.red(`Error connecting to MongoDB URI: ${serverConfig.uri}`));
        console.log(chalk.white.bgRed(err as any));
        cleanupAndExit();
    }

    try {
        const renderer = new Renderer(prefs, args.config);
        let body: string | undefined;
        while (true) {
            const header = renderer.renderHeader();
            let queries: any;
            if (!prefs.paused) {
                queries = await db!.command({ currentOp: 1, secs_running: { $gte: Number(prefs.minTime) } });
                body = renderer.renderBody(queries.inprog);
            }

            if (!prefs.paused || !prefs.finishedPausing) {
                clear();
                console.log(header, body);
                prefs.finishedPausing = prefs.paused;
            }

            if ((args as any).once) {
                break;
            }

            const interval = prefs.paused ? 0.5 : prefs.refreshInterval;
            await sleep(interval);

            if (prefs.snapshot && queries) {
                // User requested to save a snapshot of the current queries to disk for later analysis
                // Await the async save operation
                await renderer.save(queries.inprog);
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
