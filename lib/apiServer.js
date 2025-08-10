import express from "express";
import cors from "cors";
import chalk from "chalk";
import JsonRenderer from "./jsonRenderer.js";

export class ApiServer {
    constructor(db, prefs, config) {
        this.db = db;
        this.prefs = prefs;
        this.config = config;
        this.app = express();
        this.renderer = new JsonRenderer(prefs, config);
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());

        // Basic request logging
        this.app.use((req, res, next) => {
            // console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Get current operations
        this.app.get("/api/currentOp", async (req, res) => {
            try {
                const minTime = req.query.minTime ? Number(req.query.minTime) : this.prefs.minTime;
                const queries = await this.db.command({
                    currentOp: 1,
                    secs_running: { $gte: minTime },
                });

                const header = this.renderer.renderHeader();
                const body = this.renderer.renderBody(queries.inprog);

                res.json({
                    success: true,
                    metadata: header,
                    data: body,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error fetching current operations:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to fetch current operations",
                    message: error.message,
                });
            }
        });

        // Kill a specific query
        this.app.delete("/api/killOp/:opid", async (req, res) => {
            try {
                const { opid } = req.params;
                const result = await this.db.command({
                    killOp: 1,
                    op: parseInt(opid),
                });

                res.json({
                    success: true,
                    message: `Query ${opid} killed successfully`,
                    result,
                });
            } catch (error) {
                console.error("Error killing operation:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to kill operation",
                    message: error.message,
                });
            }
        });

        // Get server info
        this.app.get("/api/info", (req, res) => {
            res.json({
                success: true,
                data: {
                    server: this.config,
                    preferences: {
                        refreshInterval: this.prefs.refreshInterval,
                        minTime: this.prefs.minTime,
                        showAll: this.prefs.all,
                        logThreshold: this.prefs.log,
                        paused: this.prefs.paused,
                        reversed: this.prefs.reversed,
                    },
                },
            });
        });

        // Update preferences
        this.app.post("/api/preferences", (req, res) => {
            try {
                const allowedPrefs = ["refreshInterval", "minTime", "all", "log", "paused", "reversed"];
                const updates = {};

                for (const key of allowedPrefs) {
                    if (req.body.hasOwnProperty(key)) {
                        this.prefs[key] = req.body[key];
                        updates[key] = req.body[key];
                    }
                }

                res.json({
                    success: true,
                    message: "Preferences updated",
                    updated: updates,
                    current: this.prefs,
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: "Failed to update preferences",
                    message: error.message,
                });
            }
        });

        // Save snapshot
        this.app.post("/api/snapshot", async (req, res) => {
            try {
                const queries = await this.db.command({
                    currentOp: 1,
                    secs_running: { $gte: this.prefs.minTime },
                });

                this.renderer.save(queries.inprog);

                res.json({
                    success: true,
                    message: "Snapshot saved successfully",
                    queryCount: queries.inprog.length,
                });
            } catch (error) {
                console.error("Error saving snapshot:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to save snapshot",
                    message: error.message,
                });
            }
        });

        // Health check
        this.app.get("/health", (req, res) => {
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                server: this.config,
            });
        });

        // API documentation
        this.app.get("/", (req, res) => {
            res.json({
                name: "MongoDB Query Top API",
                version: "1.0.0",
                endpoints: {
                    "GET /api/currentop": "Get current MongoDB operations",
                    "GET /api/info": "Get server and preference information",
                    "POST /api/preferences": "Update monitoring preferences",
                    "POST /api/snapshot": "Save current operations snapshot",
                    "DELETE /api/killOp/:opid": "Kill a specific operation",
                    "GET /health": "Health check endpoint",
                },
                parameters: {
                    "/api/currentop": {
                        minTime: "Minimum runtime in seconds (query parameter)",
                    },
                },
            });
        });
    }

    start(port) {
        return new Promise(resolve => {
            const server = this.app.listen(port, () => {
                console.log(chalk.green(`MongoDB Query Top API server running on port ${port}`));
                console.log(`API: ${chalk.bold(`http://localhost:${port}`)}`, `Config: ${chalk.bold(this.config)}`);
                console.log(`Current Ops: /api/currentOp`);
                console.log(`Server Info: /api/info`);
                resolve(server);
            });
        });
    }
}

export default ApiServer;
