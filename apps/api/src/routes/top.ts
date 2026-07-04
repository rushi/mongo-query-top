import type { ServerConfig, TopCommandResult, TopNode } from "@mongo-query-top/types";
import config from "config";
import type { FastifyInstance } from "fastify";
import type { MongoClient } from "mongodb";
import { getPinnedClient } from "../core/lib/pinnedClient.js";
import { parseReadPreference } from "../core/lib/readPreference.js";
import { buildCollectionActivity } from "../core/lib/topProcessor.js";
import { nextMockTop } from "../data/mockTop.js";

const serverConfigs = config.get<Record<string, ServerConfig>>("servers");

const fetchRawTop = async (client: MongoClient, readPreference?: string): Promise<TopCommandResult> => {
    const result = await client
        .db("admin")
        .command({ top: 1 }, { readPreference: parseReadPreference(readPreference) });
    return result as TopCommandResult;
};

// Resolves the sampling client for a stream. When a specific node is requested,
// pins to it via a directConnection client so consecutive samples hit the same
// node (per-interval diffs across different secondaries are meaningless). Falls
// back to the pooled client if pinning fails (e.g. mongodb+srv uris).
const resolveSampleClient = async (
    fastify: FastifyInstance,
    pooledClient: MongoClient,
    serverId: string,
    node: string | undefined,
): Promise<{ client: MongoClient; pinned: boolean }> => {
    const uri = serverConfigs[serverId]?.uri;
    if (!node || !uri) {
        return { client: pooledClient, pinned: false };
    }

    try {
        const client = await getPinnedClient(serverId, node, uri);
        return { client, pinned: true };
    } catch (err) {
        fastify.log.warn(`Node pinning failed for ${serverId}/${node}, using pooled client: ${(err as Error).message}`);
        return { client: pooledClient, pinned: false };
    }
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

    // GET /api/top/:serverId/nodes - List replica-set members so the client can pin sampling to one
    fastify.get<{
        Params: { serverId: string };
    }>("/:serverId/nodes", async (request, reply) => {
        const { serverId } = request.params;

        if (serverId === "mock") {
            return { nodes: [{ host: "mock", role: "primary" }] satisfies TopNode[] };
        }

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            const hello = await client.db("admin").command({ hello: 1 });
            const hosts: string[] = hello.hosts ?? [];
            const primary: string | undefined = hello.primary;
            const nodes: TopNode[] = hosts.map((host) => ({
                host,
                role: host === primary ? "primary" : "secondary",
            }));
            return { nodes };
        } catch (err) {
            return reply.code(500).send({ error: "Failed to list nodes", message: (err as Error).message });
        }
    });

    // GET /api/top/:serverId/stream - Real-time SSE stream of per-interval activity
    fastify.get<{
        Params: { serverId: string };
        Querystring: { refreshInterval?: string; showAll?: string; readPreference?: string; node?: string };
    }>("/:serverId/stream", async (request, reply) => {
        // SSE: take over the socket so Fastify never auto-sends a reply (see queries.ts).
        reply.hijack();

        const { serverId } = request.params;
        const { refreshInterval = "2", showAll = "false", readPreference, node } = request.query;
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

        // Pin sampling to the requested node so consecutive diffs hit the same mongod.
        // Pinned reads use secondaryPreferred so a directConnection to a secondary is accepted.
        const { client: sampleClient, pinned } = isMock
            ? { client, pinned: false }
            : await resolveSampleClient(fastify, client!, serverId, node);
        const effectiveReadPreference = pinned ? "secondaryPreferred" : readPreference;

        // Per-stream previous sample keeps diffs correct even with multiple clients
        // streaming the same server (no shared service state).
        let previousSample: TopCommandResult | undefined;

        const sendTopUpdate = async () => {
            if (!isActive) {
                return;
            }

            try {
                const current = isMock
                    ? nextMockTop(previousSample)
                    : await fetchRawTop(sampleClient!, effectiveReadPreference);
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

        // Prime the baseline so the first emitted frame carries a real per-interval
        // diff instead of an all-zero frame (which would dim the whole table). Like
        // mongotop, the first rate appears after one interval.
        try {
            previousSample = isMock ? nextMockTop() : await fetchRawTop(sampleClient!, effectiveReadPreference);
        } catch (err) {
            if (isActive) {
                reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
            }
        }

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
