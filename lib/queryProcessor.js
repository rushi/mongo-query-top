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
        "connectionId",
        "currentOpTime",
        "clientMetadata",
        "desc",
        "flowControlStats",
        // TODO: Some processing on lock stats
        "lockStats",
        "locks",
        "lsid",
        "opid",
        "microsecs_running",
        "waitingForFlowControl",
        "waitingForLatch",
    ]);

    if (q.appName?.match(/NoSQLBooster/i)) {
        query = _.omit(query, ["clientMetadata"]);
    }

    if (full) {
        query = _.omit(query, ["appName", "ns", "op", "secs_running"])
    }

    return query;
}

export function formatUserAgent(q) {
    const { appName, clientMetadata } = q;
    if (appName) {
        if (q.appName.match(/NoSQLBooster/i)) {
            return chalk.bold("NoSQLBooster");
        }
        if (q.appName.match(/MongoDB Monitoring Module/i)) {
            return "Monitoring Module";
        }
        if (q.appName.match(/MongoDB Automation Agent/i)) {
            return "Automation Agent";
        }
    }

    if (clientMetadata) {
        if (clientMetadata.driver?.name?.match(/nodejs\|Mongoose/i)) {
            return chalk.bold("Mongoose");
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

        if (clientMetadata.driver?.name.match(/ext-mongodb:PHP/)) {
            return "PHP ext-mongodb";
        }

        const NODE_RE = /Node(.js)?\sv\d+/i
        const matches = clientMetadata.platform?.match(NODE_RE);
        if (matches?.[0]) {
            return chalk.bold(matches?.[0]);
        }
    }

    return clientMetadata?.application?.name ?? clientMetadata?.driver?.name ?? beautifyJson(clientMetadata);
}

export function summarizeArray(data) {
    const byCount = _.countBy(data);
    const sortedObj = _.fromPairs(_.sortBy(_.toPairs(byCount), [(value) => value[1]]).reverse());
    return _.toPairs(sortedObj).map(r => r.reverse().join(" x ")).join(", ")
}
