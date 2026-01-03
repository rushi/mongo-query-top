import type { ServerConfig } from "@mongo-query-top/types";
import config from "config";
import type { FastifyInstance } from "fastify";

// Load server configs using the config module
// Looks for config/default.yaml and config/local.yaml in project root
const serverConfigs = config.get<Record<string, ServerConfig>>("servers");

export default async function serversRoutes(fastify: FastifyInstance) {
    // GET /api/servers - List all configured servers
    fastify.get("/", async (request) => {
        const serverList = Object.entries(serverConfigs).map(([id, config]) => ({
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
        const serverConfig = serverConfigs[id];

        if (!serverConfig) {
            return reply.code(404).send({ error: "Server not found" });
        }

        try {
            await request.services.mongoService.connect(id, serverConfig.uri);
            return {
                success: true,
                serverId: id,
                serverName: serverConfig.name,
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
        const serverConfig = serverConfigs[id];

        if (!serverConfig) {
            return reply.code(404).send({ error: "Server not found" });
        }

        const connected = request.services.mongoService.isConnected(id);

        return {
            serverId: id,
            serverName: serverConfig.name,
            connected,
        };
    });
}
