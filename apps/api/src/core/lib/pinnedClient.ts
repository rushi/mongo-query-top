import { MongoClient } from "mongodb";
import { buildDirectUri } from "./directUri.js";

// Match MongoConnectionService: keep BSON Longs intact to avoid Number overflow.
const CLIENT_OPTIONS = { promoteLongs: false, promoteValues: true, promoteBuffers: false };

// Dedicated directConnection clients, one per node, reused across streams so
// switching nodes or reconnecting doesn't churn connections.
const pinnedClients = new Map<string, MongoClient>();

const keyFor = (serverId: string, host: string): string => `${serverId}::${host}`;

export const getPinnedClient = async (serverId: string, host: string, replicaSetUri: string): Promise<MongoClient> => {
    const key = keyFor(serverId, host);
    const existing = pinnedClients.get(key);
    if (existing) {
        return existing;
    }

    const client = new MongoClient(buildDirectUri(replicaSetUri, host), CLIENT_OPTIONS);
    await client.connect();
    pinnedClients.set(key, client);
    return client;
};

export const closePinnedClients = async (): Promise<void> => {
    const clients = Array.from(pinnedClients.values());
    pinnedClients.clear();
    await Promise.all(clients.map(async (client) => client.close()));
};
