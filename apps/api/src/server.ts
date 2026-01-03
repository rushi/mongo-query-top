#!/usr/bin/env node
import cors from "@fastify/cors";
import Fastify from "fastify";
import "dotenv/config";
import { MongoConnectionService, QueryLoggerService, QueryService } from "@mongo-query-top/core";
import queriesRoutes from "./routes/queries.js";
import serversRoutes from "./routes/servers.js";

// Extend Fastify types to include services
declare module "fastify" {
    interface FastifyRequest {
        services: {
            mongoService: MongoConnectionService;
            queryService: QueryService;
            loggerService: QueryLoggerService;
        };
    }
}

const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || "info",
    },
});

// Services - singleton instances
const mongoService = new MongoConnectionService();
const queryService = new QueryService();
const loggerService = new QueryLoggerService();

// CORS for frontend
await fastify.register(cors, {
    origin: [
        "http://localhost:9000", // Vite dev server (preferred)
        "http://localhost:3000", // Vite dev server (legacy/fallback)
        "http://localhost:9173",
        process.env.FRONTEND_URL || "http://localhost:9000",
    ],
    credentials: true,
});

// Simple API key auth middleware (supports both header and query parameter for EventSource compatibility)
fastify.addHook("onRequest", async (request, reply) => {
    // Skip auth for OPTIONS requests (CORS preflight)
    if (request.method === "OPTIONS") {
        return;
    }

    // Skip auth for health check
    if (request.url === "/health") {
        return;
    }

    const headerKey = request.headers["x-api-key"] as string;
    const queryKey = (request.query as any)?.apiKey;
    const apiKey = headerKey || queryKey;
    const validKey = process.env.API_KEY || "dev-key-change-in-production";

    if (apiKey !== validKey) {
        reply.code(401).send({ error: "Unauthorized" });
    }
});

// Attach services to request context
fastify.addHook("onRequest", async (request) => {
    request.services = { mongoService, queryService, loggerService };
});

// Routes
await fastify.register(serversRoutes, { prefix: "/api/servers" });
await fastify.register(queriesRoutes, { prefix: "/api/queries" });

// Health check
fastify.get("/health", async () => {
    return {
        status: "ok",
        timestamp: new Date().toISOString(),
        connectedServers: mongoService.getConnectedServers(),
    };
});

// Graceful shutdown
process.on("SIGINT", async () => {
    fastify.log.info("Shutting down gracefully...");
    await mongoService.disconnectAll();
    await fastify.close();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    fastify.log.info("Shutting down gracefully...");
    await mongoService.disconnectAll();
    await fastify.close();
    process.exit(0);
});

// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || "9001", 10);
        const host = process.env.HOST || "0.0.0.0";

        await fastify.listen({ port, host });
        fastify.log.info(`API server running on http://${host}:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
