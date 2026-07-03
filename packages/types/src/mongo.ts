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
