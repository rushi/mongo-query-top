export interface MongoQuery {
    index: number;
    opid: string;
    runTime: number;
    runTimeFormatted: string;
    operation: string;
    namespace: string;
    query: any;
    planSummary?: string;
    isCollectionScan: boolean;
    waitingForLock: boolean;
    message?: string;
    client?: {
        ip: string;
        location?: {
            city: string;
            region: string;
            country: string;
        };
    };
    userAgent: string;
    effectiveUsers?: any;
}

export interface QuerySummary {
    totalQueries: number;
    displayedQueries: number;
    skippedQueries: number;
    unindexedQueries: number;
    operations: Record<string, number>;
    namespaces: Record<string, number>;
    userAgents: Record<string, number>;
}

export interface ServerMetadata {
    server: string;
    uri: string;
    refreshInterval: number;
    minTime: number;
    timestamp: string;
    paused: boolean;
    reversed: boolean;
    showAll: boolean;
    message?: string;
}

export interface CurrentOpResponse {
    success: boolean;
    metadata: ServerMetadata;
    data: {
        queries: MongoQuery[];
        summary: QuerySummary;
    };
    timestamp: string;
}

export interface ServerInfo {
    success: boolean;
    data: {
        server: string;
        preferences: {
            refreshInterval: number;
            minTime: number;
            showAll: boolean;
            logThreshold: number;
            paused: boolean;
            reversed: boolean;
        };
    };
}
