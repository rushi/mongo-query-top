import _ from "lodash";
import { beautifyJson } from "./helpers.js";

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

    return false;
}

export function sanitizeQuery(q) {
    const query = _.omit(q, [
        "active",
        "appName",
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
        "ns",
        "op",
        "opid",
        "microsecs_running",
        "secs_running",
        "waitingForFlowControl",
        "waitingForLatch",
    ]);

    if (q.appName?.match(/NoSQLBooster/i)) {
        return _.omit(query, ["clientMetadata"]);
    }

    return query;
}

export function formatUserAgent(q) {
    const { appName, clientMetadata } = q;
    if (appName) {
        if (q.appName.match(/NoSQLBooster/i)) {
            return "NoSQLBooster";
        }
        if (q.appName.match(/MongoDB Monitoring Module/i)) {
            return "MongoDB Monitoring Module";
        }
        if (q.appName.match(/MongoDB Automation Agent/i)) {
            return "MongoDB Automation Agent";
        }
    }

    if (clientMetadata) {
        if (clientMetadata.driver?.name?.match(/Mongoose/i)) {
            return clientMetadata.driver?.name;
        }

        if (clientMetadata.driver?.name?.match(/NetworkInterfaceTL/i)) {
            return "NetworkInterfaceTL";
        }

        if (clientMetadata.application?.name?.match(/MongoDB Monitoring Module/i)) {
            return "MongoDB Monitoring Module";
        }

        if (clientMetadata.application?.name?.match(/MongoDB Automation Agent/i)) {
            return "MongoDB Automation Agent";
        }

        if (clientMetadata.driver?.name.match(/ext-mongodb:PHP/)) {
            return "PHP ext-mongodb";
        }

        const NODE_RE = /Node(.js)?\sv\d+\.\d+/i
        const matches = clientMetadata.platform?.match(NODE_RE);
        if (matches?.[0]) {
            return matches?.[0];
        }
    }

    return beautifyJson(clientMetadata);
}
