#!/usr/bin/env node

import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import { MongoConnectionService } from "./services/MongoConnectionService.js";
import { QueryService } from "./services/QueryService.js";
import { QueryLoggerService } from "./services/QueryLoggerService.js";
import serversRoutes from "./api/routes/servers.js";
import queriesRoutes from "./api/routes/queries.js";

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
    origin: ["http://localhost:9000", "http://localhost:9173", process.env.FRONTEND_URL || "http://localhost:9000"],
    credentials: true,
});

// Simple API key auth middleware
fastify.addHook("onRequest", async (request, reply) => {
    const apiKey = request.headers["x-api-key"];
    const validKey = process.env.API_KEY || "dev-key-change-in-production";

    if (apiKey !== validKey) {
        reply.code(401).send({ error: "Unauthorized" });
    }
});

// Attach services to request context
fastify.addHook("onRequest", async request => {
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
