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
    query: Record<string, any>;
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

export interface Server {
    id: string;
    name: string;
    connected: boolean;
}
