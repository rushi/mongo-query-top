import type { MongoQuery } from "@mongo-query-top/types";
import { omit } from "lodash-es";
import { beautifyJson } from "./helpers.js";

export const shouldSkipQuery = (q: MongoQuery): boolean => {
    const { command, clientMetadata, appName } = q;

    const isIndex = q.ns?.includes("system.indexes");
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

    if (appName?.match(/mongodb (monitoring module|automation)/i)) {
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

export const sanitizeQuery = (q: MongoQuery, full = true): Record<string, unknown> => {
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

    if (q.appName?.match(/nosqlbooster/i)) {
        query = omit(query, ["clientMetadata"]);
    }

    if (full) {
        query = omit(query, ["appName", "effectiveUsers", "ns", "op", "secs_running"]);
    }

    if ((q as unknown as Record<string, unknown>).type === "op") {
        delete (query as unknown as Record<string, unknown>).type;
    }

    if (q.waitingForLock === false) {
        delete (query as unknown as Record<string, unknown>).waitingForLock;
    }

    if (Object.keys(query).length === 1 && (query as unknown as Record<string, unknown>).command) {
        // The query is the only thing left after filtering
        return (query as unknown as Record<string, unknown>).command as Record<string, unknown>;
    }

    return query;
};

export const formatUserAgent = (q: MongoQuery): string => {
    const { appName, clientMetadata } = q;
    if (appName) {
        if (appName.match(/nosqlbooster/i)) {
            return "NoSQLBooster";
        }
        if (appName.match(/mongodb monitoring module/i)) {
            return "Monitoring Module";
        }
        if (appName.match(/mongodb automation agent/i)) {
            return "Automation Agent";
        }
    }

    if (clientMetadata) {
        if (clientMetadata.driver?.name?.match(/nodejs\|mongoose/i)) {
            return "Mongoose";
        }

        if (clientMetadata.driver?.name?.match(/networkinterfacetl/i)) {
            return "NetworkInterfaceTL";
        }

        if (clientMetadata.application?.name?.match(/mongodb monitoring module/i)) {
            return "Monitoring Module";
        }

        if (clientMetadata.application?.name?.match(/mongodb automation agent/i)) {
            return "Automation Agent";
        }

        if (clientMetadata.application?.name?.match(/oplogfetcher/i)) {
            return "OplogFetcher";
        }

        if (clientMetadata.application?.name?.match(/mongodb cps module/i)) {
            return "CPS Module";
        }

        if (clientMetadata.driver?.name?.match(/ext-mongodb:PHP/)) {
            return "PHP ext-mongodb";
        }

        const NODE_RE = /node(.js)?\sv\d+/i;
        const matches = clientMetadata.platform?.match(NODE_RE);
        if (matches?.[0]) {
            return matches[0];
        }
    }

    return clientMetadata?.application?.name ?? clientMetadata?.driver?.name ?? beautifyJson(clientMetadata);
};
