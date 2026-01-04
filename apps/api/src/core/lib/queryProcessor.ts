import type { MongoQuery } from "@mongo-query-top/types";
import { countBy, omit } from "lodash-es";
import { beautifyJson } from "./helpers.js";

export const shouldSkipQuery = (q: MongoQuery): boolean => {
    const { command, clientMetadata, appName } = q;

    const isIndex = q.ns && q.ns.indexOf("system.indexes") >= 0;
    if (isIndex) {
        // Always show indexing queries
        return false;
    }

    if (q.client?.startsWith("192")) {
        // This is an internal query
        return true;
    }

    if (clientMetadata) {
        if (clientMetadata.driver?.name?.match(/MongoDB Internal Client|NetworkInterfaceTL/)) {
            return true;
        }
        if (clientMetadata.driver?.name?.match(/ext-mongodb/i)) {
            // This is from our PHP MongoDB extension - always show this
            return false;
        }
    }

    if (appName?.match(/MongoDB (Monitoring Module|Automation)/i)) {
        return true;
    }

    if (q.command.hello === 1 || q.command.hello === true) {
        return true;
    }

    if (command?.ismaster === true) {
        return true;
    }

    if (command["$db"] === "config") {
        return true;
    }

    return false;
};

export const sanitizeQuery = (q: MongoQuery, full: boolean = true): Record<string, any> => {
    let query = omit(q, [
        "active",
        "client",
        "command.$clusterTime",
        "command.lsid",
        "command.$db",
        "connectionId",
        "clientMetadata",
        "desc",
        "host",
        "flowControlStats",
        "numYields",
        // TODO: Some processing on lock stats
        "lockStats",
        "locks",
        "lsid",
        "opid",
        "microsecs_running",
        "transaction",
        "waitingForFlowControl",
        "waitingForLatch",
        "planSummary", // TODO: Better way to show this
    ]);

    if (q.appName?.match(/NoSQLBooster/i)) {
        query = omit(query, ["clientMetadata"]);
    }

    if (full) {
        query = omit(query, ["appName", "effectiveUsers", "ns", "op", "secs_running"]);
    }

    if ((q as any).type === "op") {
        delete (query as any).type;
    }

    if (q.waitingForLock === false) {
        delete (query as any).waitingForLock;
    }

    if (Object.keys(query).length === 1 && (query as any).command) {
        // The query is the only thing left after filtering
        return (query as any).command;
    }

    return query;
};

export const formatUserAgent = (q: MongoQuery): string => {
    const { appName, clientMetadata } = q;
    if (appName) {
        if (appName.match(/NoSQLBooster/i)) {
            return "NoSQLBooster";
        }
        if (appName.match(/MongoDB Monitoring Module/i)) {
            return "Monitoring Module";
        }
        if (appName.match(/MongoDB Automation Agent/i)) {
            return "Automation Agent";
        }
    }

    if (clientMetadata) {
        if (clientMetadata.driver?.name?.match(/nodejs\|Mongoose/i)) {
            return "Mongoose";
        }

        if (clientMetadata.driver?.name?.match(/NetworkInterfaceTL/i)) {
            return "NetworkInterfaceTL";
        }

        if (clientMetadata.application?.name?.match(/MongoDB Monitoring Module/i)) {
            return "Monitoring Module";
        }

        if (clientMetadata.application?.name?.match(/MongoDB Automation Agent/i)) {
            return "Automation Agent";
        }

        if (clientMetadata.application?.name?.match(/OplogFetcher/i)) {
            return "OplogFetcher";
        }

        if (clientMetadata.application?.name?.match(/MongoDB CPS Module/i)) {
            return "CPS Module";
        }

        if (clientMetadata.driver?.name?.match(/ext-mongodb:PHP/)) {
            return "PHP ext-mongodb";
        }

        const NODE_RE = /Node(.js)?\sv\d+/i;
        const matches = clientMetadata.platform?.match(NODE_RE);
        if (matches?.[0]) {
            return matches[0];
        }
    }

    return (clientMetadata as any)?.application?.name ?? clientMetadata?.driver?.name ?? beautifyJson(clientMetadata);
};

export const summarizeArray = (data: string[]): string => {
    // Use lodash-es countBy (cleaner than native reduce)
    const counts = countBy(data);

    // Sort by count descending using native methods
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => `${count} x ${key}`)
        .join(", ");
};
