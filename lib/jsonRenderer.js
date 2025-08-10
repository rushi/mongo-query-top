import appConfig from "config";
import dayjs from "dayjs";
import fs from "fs";
import geoip from "geoip-lite";
import _ from "lodash";
import shortHumanizeTime from "./helpers.js";
import { formatUserAgent, sanitizeQuery, shouldSkipQuery } from "./queryProcessor.js";

const PUBLIC_IP_REGEX = /(\d+)(?<!10)\.(\d+)(?<!192\.168)(?<!172\.(1[6-9]|2\d|3[0-1]))\.(\d+)\.(\d+)/;

// Function to strip ANSI escape codes (chalk colors) from strings
function stripAnsiCodes(str) {
    if (typeof str !== "string") return str;
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1b\[[0-9;]*m/g, "");
}

export default class JsonRenderer {
    constructor(prefs, config) {
        this.prefs = prefs;
        this.config = config;
        this.skipped = 0;
        this.headerText = "";
    }

    renderHeader() {
        return {
            server: this.config,
            uri: appConfig
                .get(this.config)
                .uri.replace(/^.*\@/g, "")
                .replace(/:27017/g, ""),
            refreshInterval: this.prefs.refreshInterval,
            minTime: this.prefs.minTime,
            timestamp: dayjs().format(),
            paused: this.prefs.paused,
            reversed: this.prefs.reversed,
            showAll: this.prefs.all,
            message: this.headerText ? stripAnsiCodes(this.headerText) : null,
        };
    }

    renderBody(queries) {
        this.skipped = 0;

        // Sort queries in ascending order of run time. Longest running at the bottom for easy diagnosis
        let filteredQueries = _.sortBy(queries, q => q.microsecs_running);
        filteredQueries = this.prefs.reversed ? _.reverse(filteredQueries) : filteredQueries;
        filteredQueries = this.getFilteredQueries(filteredQueries);

        const summaryRow = { count: 0, op: [], ns: [], userAgent: [], badIndex: 0 };
        const processedQueries = [];

        let idx = 1;
        _.each(filteredQueries, q => {
            const query = sanitizeQuery(q);
            const processedQuery = {
                index: idx++,
                opid: q.opid,
                runTime: q.secs_running,
                runTimeFormatted: q.secs_running > 0 ? shortHumanizeTime(q.secs_running * 1000) : "< 1s",
                operation: stripAnsiCodes(q.op),
                namespace: stripAnsiCodes(q.ns),
                query: query,
                planSummary: q.planSummary,
                isCollectionScan: q.planSummary === "COLLSCAN",
                waitingForLock: q.waitingForLock || false,
                message: q.msg ? stripAnsiCodes(q.msg) : null,
                client: null,
                userAgent: stripAnsiCodes(formatUserAgent(q)),
                effectiveUsers: query.effectiveUsers || null,
            };

            if (q.client) {
                const client = q.client.replace(/:.*$/, ""); // Slice off the port at the end of the string
                processedQuery.client = {
                    ip: client,
                    location: null,
                };

                if (client.match(PUBLIC_IP_REGEX)) {
                    const geo = geoip.lookup(client);
                    if (geo) {
                        processedQuery.client.location = {
                            city: geo.city,
                            region: geo.region,
                            country: geo.country,
                        };
                    }
                }
            }

            if (q.secs_running >= this.prefs.log) {
                this.saveQuery(q, q.ns);
            }

            processedQueries.push(processedQuery);
        });

        // Calculate summary statistics
        for (const q of queries) {
            if (shouldSkipQuery(q)) {
                continue;
            }

            summaryRow.count++;
            summaryRow.op.push(stripAnsiCodes(q.op));
            summaryRow.ns.push(stripAnsiCodes(q.ns));
            summaryRow.userAgent.push(stripAnsiCodes(formatUserAgent(q)));

            if (q.planSummary === "COLLSCAN" && !shouldSkipQuery(q)) {
                summaryRow.badIndex++;
            }
        }

        const summary = {
            totalQueries: queries.length,
            displayedQueries: processedQueries.length,
            skippedQueries: this.skipped,
            unindexedQueries: summaryRow.badIndex,
            operations: this.getSummaryStats(summaryRow.op),
            namespaces: this.getSummaryStats(summaryRow.ns),
            userAgents: this.getSummaryStats(summaryRow.userAgent),
        };

        return {
            queries: processedQueries,
            summary: summary,
        };
    }

    getSummaryStats(data) {
        const byCount = _.countBy(data);
        const sortedObj = _.fromPairs(_.sortBy(_.toPairs(byCount), [value => value[1]]).reverse());
        return sortedObj;
    }

    getFilteredQueries(queries) {
        if (this.prefs.all === true) {
            return queries;
        }

        return queries.filter(q => {
            if (shouldSkipQuery(q)) {
                this.skipped++;
                return false;
            }

            return true;
        });
    }

    save(queries) {
        const filteredQueries = this.getFilteredQueries(queries);
        const now = dayjs().format();
        if (filteredQueries.length > 0) {
            const folderPath = `logs/${this.config}`;
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            const fileNameRaw = `queries-raw-${now}.json`;
            fs.writeFileSync(`${folderPath}/${fileNameRaw}`, JSON.stringify(filteredQueries, null, 2));

            const fileNameSanitized = `queries-sanitized-${now}.json`;
            const sanitizedQueries = filteredQueries.map(q => sanitizeQuery(q, false));
            fs.writeFileSync(`${folderPath}/${fileNameSanitized}`, JSON.stringify(sanitizedQueries, null, 2));
            this.headerText = `Wrote ${filteredQueries.length} to ${folderPath}/${fileNameSanitized}`;
        }

        this.prefs.snapshot = false;
    }

    saveQuery(query, collection, type = "") {
        const folderPath = `logs/${this.config}`;
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const rawFolderPath = folderPath + "/raw/";
        if (!fs.existsSync(rawFolderPath)) {
            fs.mkdirSync(rawFolderPath, { recursive: true });
        }

        const rawQuery = query;
        type = type ? `${type}-` : type;
        const fileNameRaw = `${rawFolderPath}/query-${rawQuery.opid}-${collection}-${type}raw.json`;
        fs.writeFileSync(fileNameRaw, JSON.stringify(rawQuery, null, 2));

        const sanitized = { ...sanitizeQuery(query, false), secs_running: rawQuery.secs_running };
        const filenameSanitized = `${folderPath}/query-${rawQuery.opid}-${collection}-${type}sanitized.json`;
        fs.writeFileSync(filenameSanitized, JSON.stringify(sanitized, null, 2));

        this.headerText = `Wrote query ${rawQuery.opid} to disk`;
    }
}
