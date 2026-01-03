import { Db, MongoClient } from "mongodb";

export class MongoConnectionService {
    private connections: Map<string, MongoClient> = new Map();

    async connect(serverId: string, uri: string): Promise<MongoClient> {
        if (this.connections.has(serverId)) {
            return this.connections.get(serverId)!;
        }

        const client = new MongoClient(uri, {
            // Prevent BSON Long from auto-converting to Number to avoid overflow
            promoteLongs: false,
            promoteValues: true,
            promoteBuffers: false,
        });
        await client.connect();
        this.connections.set(serverId, client);
        return client;
    }

    async disconnect(serverId: string): Promise<void> {
        const client = this.connections.get(serverId);
        if (client) {
            await client.close();
            this.connections.delete(serverId);
        }
    }

    async disconnectAll(): Promise<void> {
        const closePromises = Array.from(this.connections.values()).map((client) => client.close());
        await Promise.all(closePromises);
        this.connections.clear();
    }

    getConnection(serverId: string): MongoClient | undefined {
        return this.connections.get(serverId);
    }

    getDb(serverId: string, dbName: string = "admin"): Db | undefined {
        const client = this.connections.get(serverId);
        return client?.db(dbName);
    }

    isConnected(serverId: string): boolean {
        return this.connections.has(serverId);
    }

    getConnectedServers(): string[] {
        return Array.from(this.connections.keys());
    }
}
