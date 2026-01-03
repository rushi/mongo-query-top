#!/usr/bin/env node
import {
    cleanupAndExit,
    clear,
    MongoConnectionService,
    QueryLoggerService,
    QueryService,
    setupRawMode,
    sleep,
} from "@mongo-query-top/core";
import type { ServerConfig, UserPreferences } from "@mongo-query-top/types";
import chalk from "chalk";
import config from "config";
import ConsoleRenderer from "./ConsoleRenderer.js";
import args from "./lib/usage.js";

// Load server configs using the config module
// Looks for config/default.json and config/local.json in project root
const servers = config.util.toObject() as Record<string, ServerConfig>;

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

// Initialize services
const mongoService = new MongoConnectionService();
const queryService = new QueryService();
const loggerService = new QueryLoggerService();

async function run() {
    const serverConfig = servers[args.config];

    if (!serverConfig) {
        console.log(chalk.red(`Server config "${args.config}" not found in config files`));
        console.log(chalk.yellow(`Available configs: ${Object.keys(servers).join(", ")}`));
        cleanupAndExit();
    }

    setupRawMode(prefs);

    try {
        await mongoService.connect(args.config, serverConfig.uri);
        console.log(chalk.green(`Connected to ${serverConfig.name}`));
    } catch (err) {
        console.log(chalk.red(`Error connecting to MongoDB URI: ${serverConfig.uri}`));
        console.log(chalk.white.bgRed(err as any));
        cleanupAndExit();
    }

    try {
        const renderer = new ConsoleRenderer(prefs, args.config);
        let body: string | undefined;
        let processedQueries: any;

        while (true) {
            const header = renderer.renderHeader();

            if (!prefs.paused) {
                const db = mongoService.getDb(args.config, "admin");
                if (!db) {
                    throw new Error("Database connection lost");
                }

                const result = await db.command({
                    currentOp: 1,
                    secs_running: { $gte: Number(prefs.minTime) },
                });

                // Process queries using QueryService
                processedQueries = queryService.processQueries(result.inprog, prefs.all);
                const summary = queryService.generateSummary(processedQueries);

                // Auto-save long-running queries
                for (const q of processedQueries) {
                    if (q.secs_running >= prefs.log) {
                        loggerService.saveQuery(args.config, q, "long-running").catch((err) => {
                            console.error(chalk.red(`Error saving query: ${err.message}`));
                        });
                    }
                }

                // Render using ConsoleRenderer
                body = renderer.renderBody(processedQueries, summary);
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

            if (prefs.snapshot && processedQueries) {
                // User requested to save a snapshot of the current queries to disk
                const files = await loggerService.saveSnapshot(args.config, processedQueries);
                renderer.setFeedbackMessage(`Saved snapshot: ${files.raw}`);
                prefs.snapshot = false;
            }
        }
    } catch (err) {
        console.log(chalk.white.bgRed(`Error running db.currentOp(): ${err}`));
        console.log(err);
    }

    cleanupAndExit();
}

process.on("exit", () => {
    console.log("Closing server connections");
    mongoService.disconnectAll().catch(console.error);
});

run(); // Start
