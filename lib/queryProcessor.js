import _ from "lodash";
import { beautifyJson } from "./helpers.js";
import chalk from "chalk";

export function shouldSkipQuery(q) {
    const { command, clientMetadata, appName, ns } = q;

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
        if (clientMetadata.driver?.name.match(/ext-mongodb/i)) {
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
}

export function sanitizeQuery(q, full = true) {
    let query = _.omit(q, [
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
        query = _.omit(query, ["clientMetadata"]);
    }

    if (full) {
        query = _.omit(query, ["appName", "effectiveUsers", "ns", "op", "secs_running"]);
    }

    if (q.type === "op") {
        delete query.type;
    }

    if (q.waitingForLock === false) {
        delete query.waitingForLock;
    }

    if (Object.keys(query).length === 1 && query.command) {
        // The query is the only thing left after filtering
        return query.command;
    }

    return query;
}

export function formatUserAgent(q) {
    const { appName, clientMetadata } = q;

    // Helper to sanitize output: remove non-ASCII and ASCII control chars
    function sanitize(str) {
        if (typeof str !== "string") return str;
        // Remove ASCII control chars (0x00-0x1F, 0x7F) and non-ASCII chars (>0x7F)
        return str.replace(/[\x00-\x1F\x7F-\uFFFF]/g, "");
    }

    if (appName) {
        if (q.appName.match(/NoSQLBooster/i)) {
            return chalk.bold(sanitize("NoSQLBooster"));
        }
        if (q.appName.match(/MongoDB Monitoring Module/i)) {
            return sanitize("Monitoring Module");
        }
        if (q.appName.match(/MongoDB Automation Agent/i)) {
            return sanitize("Automation Agent");
        }
    }

    if (clientMetadata) {
        if (clientMetadata.driver?.name?.match(/nodejs\|Mongoose/i)) {
            return chalk.bold(sanitize("Mongoose"));
        }

        if (clientMetadata.driver?.name?.match(/NetworkInterfaceTL/i)) {
            return sanitize("NetworkInterfaceTL");
        }

        if (clientMetadata.application?.name?.match(/MongoDB Monitoring Module/i)) {
            return sanitize("Monitoring Module");
        }

        if (clientMetadata.application?.name?.match(/MongoDB Automation Agent/i)) {
            return sanitize("Automation Agent");
        }

        if (clientMetadata.application?.name?.match(/OplogFetcher/i)) {
            return sanitize("OplogFetcher");
        }

        if (clientMetadata.application?.name?.match(/MongoDB CPS Module/i)) {
            return sanitize("CPS Module");
        }

        if (clientMetadata.driver?.name.match(/ext-mongodb:PHP/)) {
            return sanitize("PHP ext-mongodb");
        }

        const NODE_RE = /Node(.js)?\sv\d+/i;
        const matches = clientMetadata.platform?.match(NODE_RE);
        if (matches?.[0]) {
            return chalk.bold(sanitize(matches?.[0]));
        }
    }

    const result =
        clientMetadata?.application?.name ??
        clientMetadata?.driver?.name ??
        beautifyJson(clientMetadata);

    return sanitize(result);
}

export function summarizeArray(data) {
    const byCount = _.countBy(data);
    const sortedObj = _.fromPairs(_.sortBy(_.toPairs(byCount), [value => value[1]]).reverse());
    return _.toPairs(sortedObj)
        .map(r => r.reverse().join(" x "))
        .join(", ");
}
