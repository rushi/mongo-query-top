import geoip from "geoip-lite";
import shortHumanizeTime from "../lib/helpers.js";
import { formatUserAgent, sanitizeQuery, shouldSkipQuery } from "../lib/queryProcessor.js";
import type { GeoLocation, MongoQuery } from "../types/index.js";

export interface ProcessedQuery {
    idx: number;
    opid: number;
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

export class QueryService {
    private geoCache: Map<string, GeoLocation | null> = new Map();

    processQueries(queries: MongoQuery[], showAll: boolean = false): ProcessedQuery[] {
        const filtered = showAll ? queries : queries.filter((q) => !shouldSkipQuery(q));

        return filtered
            .sort((a, b) => a.microsecs_running - b.microsecs_running)
            .map((q, idx) => this.toProcessedQuery(q, idx + 1));
    }

    private toProcessedQuery(q: MongoQuery, idx: number): ProcessedQuery {
        const [db, ...collParts] = q.ns.split(".");
        const collection = collParts.join(".");

        const clientInfo = this.parseClient(q.client);

        return {
            idx,
            opid: q.opid,
            secs_running: q.secs_running,
            runtime_formatted: this.formatRuntime(q.secs_running),
            operation: q.op,
            namespace: q.ns,
            database: db,
            collection,
            query: sanitizeQuery(q),
            client: clientInfo,
            userAgent: formatUserAgent(q),
            planSummary: q.planSummary,
            isCollscan: q.planSummary === "COLLSCAN",
            waitingForLock: q.waitingForLock,
            message: q.msg,
        };
    }

    generateSummary(queries: ProcessedQuery[]): QuerySummary {
        const operations: Record<string, number> = {};
        const collections: Record<string, number> = {};
        const clients: Record<string, number> = {};
        let unindexedCount = 0;

        for (const q of queries) {
            operations[q.operation] = (operations[q.operation] || 0) + 1;
            collections[q.collection] = (collections[q.collection] || 0) + 1;
            clients[q.userAgent] = (clients[q.userAgent] || 0) + 1;
            if (q.isCollscan) {
                unindexedCount++;
            }
        }

        return {
            totalQueries: queries.length,
            shownQueries: queries.length,
            operations,
            collections,
            clients,
            unindexedCount,
        };
    }

    private formatRuntime(seconds: number): string {
        return shortHumanizeTime(seconds * 1000);
    }

    private parseClient(client?: string): { ip: string; port?: number; geo?: GeoLocation | null } {
        if (!client) {
            return { ip: "unknown" };
        }

        const parts = client.split(":");
        const ip = parts[0];
        const port = parts[1] ? parseInt(parts[1], 10) : undefined;

        // Only lookup geo for public IPs
        const isPublicIp = ip && !ip.startsWith("192.") && !ip.startsWith("10.") && !ip.startsWith("127.");
        const geo = isPublicIp ? this.lookupGeo(ip) : null;

        return { ip, port, geo };
    }

    private lookupGeo(ip: string): GeoLocation | null {
        if (!this.geoCache.has(ip)) {
            this.geoCache.set(ip, geoip.lookup(ip));
        }
        return this.geoCache.get(ip) || null;
    }
}
