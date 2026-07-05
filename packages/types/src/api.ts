import type { GeoLocation } from "./shared";

export interface ProcessedQuery {
    idx: number;
    opid: string;
    secs_running: number;
    runtime_formatted: string;
    operation: string;
    namespace: string;
    collection: string;
    database: string;
    query: Record<string, unknown>;
    client: {
        ip: string;
        port?: number;
        geo?: GeoLocation | null;
    };
    userAgent: string;
    planSummary?: string;
    isCollscan: boolean;
    waitingForLock?: boolean;
    message?: string;
    effectiveUsers?: Array<{ user: string; db: string }>;
}

export interface QuerySummary {
    totalQueries: number;
    shownQueries: number;
    operations: Record<string, number>;
    collections: Record<string, number>;
    clients: Record<string, number>;
    unindexedCount: number;
}

export interface QueryData {
    queries: ProcessedQuery[];
    summary: QuerySummary;
    metadata: {
        serverId: string;
        timestamp: string;
        isMockData?: boolean;
    };
}

export interface ConnectedClient {
    connectionId?: number;
    client: {
        ip: string;
        port?: number;
        geo?: GeoLocation | null;
    };
    appName?: string;
    userAgent: string;
    effectiveUsers?: Array<{ user: string; db: string }>;
    active: boolean;
    currentOp?: string;
    namespace?: string;
    secs_running?: number;
    runtime_formatted?: string;
}

export interface ClientSummary {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    byApp: Record<string, number>;
    byUser: Record<string, number>;
    byIp: Record<string, number>;
}

export interface ClientsData {
    clients: ConnectedClient[];
    summary: ClientSummary;
    metadata: {
        serverId: string;
        timestamp: string;
    };
}

export interface Server {
    id: string;
    name: string;
    connected: boolean;
}

export type ActivityMode = "diff" | "cumulative";

export interface TopNode {
    host: string;
    role: "primary" | "secondary";
}

export interface ActivityMetric {
    deltaTime: number;
    deltaCount: number;
    cumTime: number;
    cumCount: number;
}

export interface CollectionActivity {
    ns: string;
    db: string;
    coll: string;
    isSystem: boolean;
    total: ActivityMetric;
    read: ActivityMetric;
    write: ActivityMetric;
}

export interface TopData {
    collections: CollectionActivity[];
    metadata: {
        serverId: string;
        timestamp: string;
        intervalMs: number;
        serverStartedAt: string;
        isMockData?: boolean;
    };
}
