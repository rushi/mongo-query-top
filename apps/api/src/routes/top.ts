import type { TopCommandResult } from "@mongo-query-top/types";
import type { FastifyInstance } from "fastify";
import type { MongoClient } from "mongodb";
import { parseReadPreference } from "../core/lib/readPreference.js";
import { buildCollectionActivity } from "../core/lib/topProcessor.js";
import { nextMockTop } from "../data/mockTop.js";

const fetchRawTop = async (client: MongoClient, readPreference?: string): Promise<TopCommandResult> => {
    const result = await client
        .db("admin")
        .command({ top: 1 }, { readPreference: parseReadPreference(readPreference) });
    return result as TopCommandResult;
};

export default async function topRoutes(fastify: FastifyInstance) {
    // GET /api/top/:serverId - One-time fetch (deltas are zero: no previous sample)
    fastify.get<{
        Params: { serverId: string };
        Querystring: { showAll?: string; readPreference?: string };
    }>("/:serverId", async (request, reply) => {
        const { serverId } = request.params;
        const { showAll = "false", readPreference } = request.query;

        if (serverId === "mock") {
            const collections = buildCollectionActivity(nextMockTop(), undefined, showAll === "true");
            return {
                collections,
                metadata: { serverId, timestamp: new Date().toISOString(), intervalMs: 0, isMockData: true },
            };
        }

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            const current = await fetchRawTop(client, readPreference);
            const collections = buildCollectionActivity(current, undefined, showAll === "true");
            return { collections, metadata: { serverId, timestamp: new Date().toISOString(), intervalMs: 0 } };
        } catch (err) {
            return reply.code(500).send({
                error: "Failed to fetch collection activity",
                message: (err as Error).message,
            });
        }
    });

    // GET /api/top/:serverId/stream - Real-time SSE stream of per-interval activity
    fastify.get<{
        Params: { serverId: string };
        Querystring: { refreshInterval?: string; showAll?: string; readPreference?: string };
    }>("/:serverId/stream", async (request, reply) => {
        // SSE: take over the socket so Fastify never auto-sends a reply (see queries.ts).
        reply.hijack();

        const { serverId } = request.params;
        const { refreshInterval = "2", showAll = "false", readPreference } = request.query;
        const isMock = serverId === "mock";

        const client = request.services.mongoService.getConnection(serverId);
        if (!isMock && !client) {
            reply.raw.writeHead(404, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": request.headers.origin ?? "*",
                "Access-Control-Allow-Credentials": "true",
            });
            reply.raw.write(JSON.stringify({ error: "Server not connected" }));
            return reply.raw.end();
        }

        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": request.headers.origin ?? "*",
            "Access-Control-Allow-Credentials": "true",
        });

        let isActive = true;
        const intervalMs = Number(refreshInterval) * 1000;
        // Per-stream previous sample keeps diffs correct even with multiple clients
        // streaming the same server (no shared service state).
        let previousSample: TopCommandResult | undefined;

        const sendTopUpdate = async () => {
            if (!isActive) {
                return;
            }

            try {
                const current = isMock ? nextMockTop(previousSample) : await fetchRawTop(client!, readPreference);
                const collections = buildCollectionActivity(current, previousSample, showAll === "true");
                previousSample = current;

                const data = {
                    collections,
                    metadata: {
                        serverId,
                        timestamp: new Date().toISOString(),
                        intervalMs,
                        ...(isMock ? { isMockData: true } : {}),
                    },
                };
                reply.raw.write(`event: top\ndata: ${JSON.stringify(data)}\n\n`);
            } catch (err) {
                if (isActive) {
                    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
                }
            }
        };

        await sendTopUpdate();

        const intervalId = setInterval(sendTopUpdate, intervalMs);

        const heartbeatId = setInterval(() => {
            if (isActive) {
                reply.raw.write(`:heartbeat\n\n`);
            }
        }, 30000);

        request.raw.on("close", () => {
            isActive = false;
            clearInterval(intervalId);
            clearInterval(heartbeatId);
            fastify.log.info(`Top SSE connection closed for server: ${serverId}`);
        });
    });
}
