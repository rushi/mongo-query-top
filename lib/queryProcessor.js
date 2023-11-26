import util from "util";
import _ from "lodash";

export function shouldSkipQuery(q) {
    const { command, clientMetadata, appName, ns } = q;
    const isIndex = q.ns && q.ns.indexOf("system.indexes") >= 0;

    if (q.client?.startsWith("192")) {
        // This is an internal query
        return true;
    }

    if (appName?.match(/MongoDB (Monitoring Module|Automation)/i)) {
        return true;
    }

    if (clientMetadata?.driver?.name?.match(/MongoDB Internal Client|NetworkInterfaceTL/)) {
        return true;
    }

    if (q.command.hello === 1 || q.command.hello === true) {
        return true;
    }

    return false;
}

export function sanitizeQuery(q) {
    const query = _.omit(q, [
        "appName",
        "active",
        "client",
        "clientMetaData",
        "desc",
        "flowControlStats",
        "opid",
        "waitingForFlowControl",
        "waitingForLatch",
        "ns",
        "op",
        "secs_running",
    ]);

    if (q.appName?.match(/NoSQLBooster/i)) {
        return _.omit(query, ["clientMetadata"]);
    }

    return query;
}

export function formatUserAgent(q) {
    const { clientMetadata } = q;
    if (q.appName) {
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
        if (clientMetadata.driver?.name?.match(/NetworkInterfaceTL/i)) {
            return "NetworkInterfaceTL";
        }

        if (clientMetadata.application?.name?.match(/MongoDB Monitoring Module/i)) {
            return "MongoDB Monitoring Module";
        }

        if (clientMetadata.application?.name?.match(/MongoDB Automation Agent/i)) {
            return "MongoDB Automation Agent";
        }

        if (clientMetadata.platform?.match(/Node\.js/i)) {
            return "Some: " + clientMetadata?.platform.slice(0, 15);
        }
    }

    return util.inspect(clientMetadata, {
        depth: 20, // This is big enough for most cases. Don't want to go too deep
        colors: true,
        breakLength: 120,
        sorted: true,
    });
}
