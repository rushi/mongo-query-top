import type { GeoLocation } from "./shared";

interface ClientLocation {
    ip: string;
    port?: number;
    geo?: GeoLocation | null;
}

interface EffectiveUser {
    user: string;
    db: string;
}

interface ServerMetadata {
    serverId: string;
    timestamp: string;
}

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
    client: ClientLocation;
    userAgent: string;
    planSummary?: string;
    isCollscan: boolean;
    waitingForLock?: boolean;
    message?: string;
    effectiveUsers?: EffectiveUser[];
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
    metadata: ServerMetadata & { isMockData?: boolean };
}

export interface ConnectedClient {
    connectionId?: number;
    client: ClientLocation;
    appName?: string;
    userAgent: string;
    effectiveUsers?: EffectiveUser[];
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
    metadata: ServerMetadata;
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
    metadata: ServerMetadata & {
        intervalMs: number;
        serverStartedAt: string;
        isMockData?: boolean;
    };
}
