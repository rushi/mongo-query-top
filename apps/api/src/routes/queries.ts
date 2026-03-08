import type { MongoQuery } from "@mongo-query-top/types";
import type { FastifyInstance } from "fastify";
import { mockQueries } from "../data/mockQueries.js";

export default async function queriesRoutes(fastify: FastifyInstance) {
    // GET /api/queries/mock - Get mock queries (for UI testing)
    fastify.get<{
        Querystring: { minTime?: string; showAll?: string };
    }>("/mock", async (request) => {
        const { minTime = "1000", showAll = "false" } = request.query;

        // Convert milliseconds to seconds for comparison with secs_running
        const minTimeSeconds = Number(minTime) / 1000;
        const shouldShowAll = showAll === "true";

        // Filter queries based on minTime
        const filteredQueries = shouldShowAll
            ? mockQueries
            : mockQueries.filter((q: MongoQuery) => q.secs_running >= minTimeSeconds);

        // Process queries using the query service
        const queries = request.services.queryService.processQueries(filteredQueries, shouldShowAll);
        const summary = request.services.queryService.generateSummary(queries);

        return {
            queries,
            summary,
            metadata: {
                serverId: "mock",
                timestamp: new Date().toISOString(),
                isMockData: true,
            },
        };
    });

    // GET /api/queries/mock/stream - Real-time SSE stream with mock data
    fastify.get<{
        Querystring: { minTime?: string; refreshInterval?: string; showAll?: string };
    }>("/mock/stream", async (request, reply) => {
        const { minTime = "1000", refreshInterval = "2", showAll = "false" } = request.query;

        // Setup SSE headers with CORS
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": request.headers.origin || "*",
            "Access-Control-Allow-Credentials": "true",
        });

        let intervalId: NodeJS.Timeout;
        let isActive = true;

        const sendQueryUpdate = async () => {
            if (!isActive) {
                return;
            }

            try {
                // Convert milliseconds to seconds for comparison with secs_running
                const minTimeSeconds = Number(minTime) / 1000;
                const shouldShowAll = showAll === "true";

                // Filter queries based on minTime
                const filteredQueries = shouldShowAll
                    ? mockQueries
                    : mockQueries.filter((q: MongoQuery) => q.secs_running >= minTimeSeconds);

                // Slightly vary the runtime to simulate real-time changes
                const queriesWithVariation = filteredQueries.map((q: MongoQuery) => ({
                    ...q,
                    secs_running: q.secs_running + Math.floor(Math.random() * 3),
                }));

                const queries = request.services.queryService.processQueries(queriesWithVariation, shouldShowAll);
                const summary = request.services.queryService.generateSummary(queries);

                const data = {
                    queries,
                    summary,
                    metadata: {
                        serverId: "mock",
                        timestamp: new Date().toISOString(),
                        isMockData: true,
                    },
                };

                reply.raw.write(`event: queries\ndata: ${JSON.stringify(data)}\n\n`);
            } catch (err: any) {
                if (isActive) {
                    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
                }
            }
        };

        // Send initial data immediately
        await sendQueryUpdate();

        // Setup interval for subsequent updates
        intervalId = setInterval(sendQueryUpdate, Number(refreshInterval) * 1000);

        // Cleanup on connection close
        request.raw.on("close", () => {
            isActive = false;
            clearInterval(intervalId);
            fastify.log.info(`Mock SSE connection closed`);
        });

        // Keep connection alive with heartbeat
        const heartbeatId = setInterval(() => {
            if (isActive) {
                reply.raw.write(`:heartbeat\n\n`);
            }
        }, 30000); // Every 30 seconds

        request.raw.on("close", () => {
            clearInterval(heartbeatId);
        });
    });

    // GET /api/queries/:serverId - Get current queries (one-time fetch)
    fastify.get<{
        Params: { serverId: string };
        Querystring: { minTime?: string; showAll?: string };
    }>("/:serverId", async (request, reply) => {
        const { serverId } = request.params;
        const { minTime = "1000", showAll = "false" } = request.query;

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            // Convert milliseconds to seconds for MongoDB query
            const minTimeSeconds = Number(minTime) / 1000;
            const db = client.db("admin");
            const result = await db.command({
                currentOp: 1,
                secs_running: { $gte: minTimeSeconds },
            });

            const queries = request.services.queryService.processQueries(result.inprog, showAll === "true");
            const summary = request.services.queryService.generateSummary(queries);

            return {
                queries,
                summary,
                metadata: {
                    serverId,
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (err: any) {
            return reply.code(500).send({
                error: "Failed to fetch queries",
                message: err.message,
            });
        }
    });

    // GET /api/queries/:serverId/stream - Real-time SSE stream
    fastify.get<{
        Params: { serverId: string };
        Querystring: {
            minTime?: string;
            refreshInterval?: string;
            showAll?: string;
            autoSaveEnabled?: string;
            autoSaveLongRunningThreshold?: string;
            autoSaveCollscan?: string;
            autoSaveTimeoutRisk?: string;
            timeoutRiskThreshold?: string;
        };
    }>("/:serverId/stream", async (request, reply) => {
        const { serverId } = request.params;
        const {
            minTime = "1000",
            refreshInterval = "2",
            showAll = "false",
            autoSaveEnabled = "false",
            autoSaveLongRunningThreshold = "60",
            autoSaveCollscan = "true",
            autoSaveTimeoutRisk = "true",
            timeoutRiskThreshold = "300",
        } = request.query;

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            reply.raw.writeHead(404, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": request.headers.origin || "*",
                "Access-Control-Allow-Credentials": "true",
            });
            reply.raw.write(JSON.stringify({ error: "Server not connected" }));
            return reply.raw.end();
        }

        // Setup SSE headers with CORS
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": request.headers.origin || "*",
            "Access-Control-Allow-Credentials": "true",
        });

        let intervalId: NodeJS.Timeout;
        let isActive = true;
        const savedQueryIds = new Set<string>();

        const sendQueryUpdate = async () => {
            if (!isActive) {
                return;
            }

            try {
                // Convert milliseconds to seconds for MongoDB query
                const minTimeSeconds = Number(minTime) / 1000;
                const db = client.db("admin");
                const result = await db.command({
                    currentOp: 1,
                    secs_running: { $gte: minTimeSeconds },
                });

                const queries = request.services.queryService.processQueries(result.inprog, showAll === "true");
                const summary = request.services.queryService.generateSummary(queries);

                // Auto-save queries if enabled
                if (autoSaveEnabled === "true") {
                    const longRunningThresholdSecs = Number(autoSaveLongRunningThreshold);
                    const timeoutRiskSecs = Number(timeoutRiskThreshold);

                    for (const query of queries) {
                        // Skip if already saved
                        if (savedQueryIds.has(query.opid)) {
                            continue;
                        }

                        let shouldSave = false;
                        let saveType = "auto-save";

                        // Check long-running threshold
                        if (query.secs_running >= longRunningThresholdSecs) {
                            shouldSave = true;
                            saveType = "auto-save-long-running";
                            fastify.log.info(
                                `Auto-save: Long-running query ${query.opid} (${query.secs_running}s >= ${longRunningThresholdSecs}s)`,
                            );
                        }

                        // Check COLLSCAN
                        if (autoSaveCollscan === "true" && query.isCollscan) {
                            shouldSave = true;
                            saveType = "auto-save-collscan";
                            fastify.log.info(`Auto-save: COLLSCAN query ${query.opid} on ${query.namespace}`);
                        }

                        // Check timeout risk
                        if (autoSaveTimeoutRisk === "true" && query.secs_running >= timeoutRiskSecs) {
                            shouldSave = true;
                            saveType = "auto-save-timeout-risk";
                            fastify.log.info(
                                `Auto-save: Timeout risk query ${query.opid} (${query.secs_running}s >= ${timeoutRiskSecs}s)`,
                            );
                        }

                        if (shouldSave) {
                            try {
                                await request.services.loggerService.saveQuery(serverId, query, saveType);
                                savedQueryIds.add(query.opid);
                                fastify.log.info(`Auto-saved query ${query.opid} (${saveType})`);
                            } catch (err: any) {
                                fastify.log.error(`Failed to auto-save query ${query.opid}: ${err.message}`);
                            }
                        }
                    }
                }

                const data = {
                    queries,
                    summary,
                    metadata: {
                        serverId,
                        timestamp: new Date().toISOString(),
                    },
                };

                reply.raw.write(`event: queries\ndata: ${JSON.stringify(data)}\n\n`);
            } catch (err: any) {
                if (isActive) {
                    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
                }
            }
        };

        // Send initial data immediately
        await sendQueryUpdate();

        // Setup interval for subsequent updates
        intervalId = setInterval(sendQueryUpdate, Number(refreshInterval) * 1000);

        // Cleanup on connection close
        request.raw.on("close", () => {
            isActive = false;
            clearInterval(intervalId);
            savedQueryIds.clear();
            fastify.log.info(`SSE connection closed for server: ${serverId}`);
        });

        // Keep connection alive with heartbeat
        const heartbeatId = setInterval(() => {
            if (isActive) {
                reply.raw.write(`:heartbeat\n\n`);
            }
        }, 30000); // Every 30 seconds

        request.raw.on("close", () => {
            clearInterval(heartbeatId);
        });
    });

    // POST /api/queries/:serverId/snapshot - Save snapshot of current queries
    fastify.post<{
        Params: { serverId: string };
        Querystring: { minTime?: string };
    }>("/:serverId/snapshot", async (request, reply) => {
        const { serverId } = request.params;
        const { minTime = "1000" } = request.query;

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            // Convert milliseconds to seconds for MongoDB query
            const minTimeSeconds = Number(minTime) / 1000;
            const db = client.db("admin");
            const result = await db.command({
                currentOp: 1,
                secs_running: { $gte: minTimeSeconds },
            });

            const queries = request.services.queryService.processQueries(result.inprog);
            const files = await request.services.loggerService.saveSnapshot(serverId, queries);

            return {
                success: true,
                savedFiles: files,
                queryCount: queries.length,
                timestamp: new Date().toISOString(),
            };
        } catch (err: any) {
            return reply.code(500).send({
                error: "Failed to save snapshot",
                message: err.message,
            });
        }
    });

    // POST /api/queries/:serverId/save - Save a single query
    fastify.post<{
        Params: { serverId: string };
        Body: { query: any; type?: string };
    }>("/:serverId/save", async (request, reply) => {
        const { serverId } = request.params;
        const { query, type = "manual-save" } = request.body;

        try {
            await request.services.loggerService.saveQuery(serverId, query, type);

            return {
                success: true,
                message: "Query saved successfully",
                timestamp: new Date().toISOString(),
            };
        } catch (err: any) {
            return reply.code(500).send({
                error: "Failed to save query",
                message: err.message,
            });
        }
    });

    // GET /api/queries/:serverId/logs - List saved log files
    fastify.get<{
        Params: { serverId: string };
    }>("/:serverId/logs", async (request, reply) => {
        const { serverId } = request.params;

        try {
            const logs = await request.services.loggerService.listLogs(serverId);

            return {
                serverId,
                logs,
                count: logs.length,
            };
        } catch (err: any) {
            return reply.code(500).send({
                error: "Failed to list logs",
                message: err.message,
            });
        }
    });

    // GET /api/queries/:serverId/logs/:filename - Read a specific log file
    fastify.get<{
        Params: { serverId: string; filename: string };
    }>("/:serverId/logs/:filename", async (request, reply) => {
        const { serverId, filename } = request.params;

        try {
            const content = await request.services.loggerService.readLog(serverId, filename);

            return {
                serverId,
                filename,
                content,
            };
        } catch (err: any) {
            return reply.code(404).send({
                error: "Log file not found",
                message: err.message,
            });
        }
    });
}
