import type { FastifyInstance } from "fastify";
import defaultConfigRaw from "../../config/default.json" with { type: "json" };
import type { ServerConfig } from "../../types/index.js";

// Convert to proper type
const defaultConfig = defaultConfigRaw as Record<string, ServerConfig>;

// Try to import local config
let localConfig: Record<string, ServerConfig> = {};
try {
    const imported = await import("../../config/local.json", { with: { type: "json" } });
    localConfig = imported.default as Record<string, ServerConfig>;
} catch {
    // local.json doesn't exist, that's okay
}

export default async function serversRoutes(fastify: FastifyInstance) {
    // GET /api/servers - List all configured servers
    fastify.get("/", async (request, reply) => {
        const servers: Record<string, ServerConfig> = { ...defaultConfig, ...localConfig };

        const serverList = Object.entries(servers).map(([id, config]) => ({
            id,
            name: config.name,
            connected: request.services.mongoService.isConnected(id),
        }));

        return { servers: serverList };
    });

    // POST /api/servers/:id/connect - Connect to a server
    fastify.post<{
        Params: { id: string };
    }>("/:id/connect", async (request, reply) => {
        const { id } = request.params;
        const servers: Record<string, ServerConfig> = { ...defaultConfig, ...localConfig };
        const config = servers[id];

        if (!config) {
            return reply.code(404).send({ error: "Server not found" });
        }

        try {
            await request.services.mongoService.connect(id, config.uri);
            return {
                success: true,
                serverId: id,
                serverName: config.name,
            };
        } catch (err: any) {
            return reply.code(500).send({
                error: "Connection failed",
                message: err.message,
            });
        }
    });

    // POST /api/servers/:id/disconnect - Disconnect from a server
    fastify.post<{
        Params: { id: string };
    }>("/:id/disconnect", async (request, reply) => {
        const { id } = request.params;

        if (!request.services.mongoService.isConnected(id)) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            await request.services.mongoService.disconnect(id);
            return {
                success: true,
                serverId: id,
            };
        } catch (err: any) {
            return reply.code(500).send({
                error: "Disconnect failed",
                message: err.message,
            });
        }
    });

    // GET /api/servers/:id/status - Check server connection status
    fastify.get<{
        Params: { id: string };
    }>("/:id/status", async (request, reply) => {
        const { id } = request.params;
        const servers: Record<string, ServerConfig> = { ...defaultConfig, ...localConfig };
        const config = servers[id];

        if (!config) {
            return reply.code(404).send({ error: "Server not found" });
        }

        const connected = request.services.mongoService.isConnected(id);

        return {
            serverId: id,
            serverName: config.name,
            connected,
        };
    });
}
