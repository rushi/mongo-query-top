import type { Long } from "bson";

export interface MongoQuery {
    opid: number | Long | bigint;
    active: boolean;
    secs_running: number;
    microsecs_running: number;
    op: string;
    ns: string;
    command: Record<string, unknown>;
    client?: string;
    appName?: string;
    clientMetadata?: {
        driver?: {
            name?: string;
            version?: string;
        };
        os?: {
            type?: string;
        };
        application?: {
            name?: string;
        };
        platform?: string;
    };
    planSummary?: string;
    msg?: string;
    effectiveUsers?: Array<{ user: string; db: string }>;
    waitingForLock?: boolean;
    connectionId?: number;
}

export interface UserPreferences {
    paused: boolean;
    reversed: boolean;
    snapshot: boolean;
    refreshInterval: number;
    minTime: number;
    all: boolean;
    log: number;
    ip?: string;
    finishedPausing: boolean;
}

export interface ServerConfig {
    name: string;
    uri: string;
}

export type ReadPreferenceMode = "primary" | "secondaryPreferred";

// Raw shape of the MongoDB `top` admin command output.
// Each metric is time (microseconds) + operation count.
export interface TopMetric {
    time: number;
    count: number;
}

export interface TopNamespaceStats {
    total: TopMetric;
    readLock: TopMetric;
    writeLock: TopMetric;
    queries: TopMetric;
    getmore: TopMetric;
    insert: TopMetric;
    update: TopMetric;
    remove: TopMetric;
    commands: TopMetric;
}

// `totals` also contains a non-namespace `note: "all times in microseconds"`
// string entry, hence the union value type.
export interface TopCommandResult {
    totals: Record<string, TopNamespaceStats | string>;
    ok: number;
}
