import c from "chalk";
import Table from "cli-table3";
import dayjs from "dayjs";
import fs from "fs";
import geoip from "geoip-lite";
import stringify from "json-stringify-pretty-compact";
import _ from "lodash";
import values from "window-size";
import shortHumanizeTime, { beautifyJson } from "./helpers.js";
import { formatUserAgent, sanitizeQuery, shouldSkipQuery } from "./queryProcessor.js";
import util from "util";

const { height, width } = values;

const PUBLIC_IP_REGEX = /(\d+)(?<!10)\.(\d+)(?<!192\.168)(?<!172\.(1[6-9]|2\d|3[0-1]))\.(\d+)\.(\d+)/;
const bold = c.bold;

export default class Renderer {
    constructor(prefs, config) {
        this.prefs = prefs;
        this.config = config;
        this.skipped = 0;
        this.headerText = "";
    }

    renderHeader() {
        const titles = [
            `db.currentOp() on ${bold(this.config)}`,
            `refresh: ${bold.green(`${this.prefs.refreshInterval}s`)}`,
            `minTime: ${bold.green(`${this.prefs.minTime}s`)}.`,
            `Time: ${dayjs(new Date()).format("MMM DD HH:mm:ss")}`,
            c.gray(`Window Size: ${JSON.stringify(width)}x${JSON.stringify(height)}`),
            c.gray(`Skipped: ${this.skipped}`),
        ];

        if (this.prefs.paused) {
            titles.push(c.italic.yellow("(paused)"));
        }

        if (this.prefs.reversed) {
            titles.push(c.italic.yellow("(reverse)"));
        }

        if (this.prefs.all) {
            titles.push("-all: Showing all queries");
        }

        if (this.headerText?.length > 0) {
            titles.push(c.cyan(this.headerText));
            setTimeout(() => {
                this.headerText = "";
            }, 2_000);
        }

        return `\n${titles.join(" ")}`;
    }

    renderBody(queries) {
        this.skipped = 0;
        const colWidths = [5, 25, 7, 25]; // #, ID, Age, ns, op
        const maxQueryLength = width - _.sum(colWidths) - 8;
        colWidths.push(maxQueryLength);

        // Sort queries in ascending order of run time. Longest running at the bottom for easy diagnosis
        queries = _.sortBy(queries, q => q.microsecs_running);
        queries = this.prefs.reversed ? _.reverse(queries) : queries;
        queries = this.getFilteredQueries(queries);

        let idx = 1;
        const data = [];
        _.each(queries, q => {
            // TODO: Clean this up and document each scenario
            const query = sanitizeQuery(q);
            const row = {
                q,
                idx: idx++,
                time: q.secs_running > 0 ? shortHumanizeTime(q.secs_running * 1000) : "< 1s",
                query: stringify(query),
                selectedQuery: beautifyJson(query, maxQueryLength)
            };

            if (_.endsWith(row.query, '..."')) {
                // this is a real long query, do something
                row.selectedQuery = c.italic("trimmed by MongoDB:\n") + row.query;
            }

            row.opid = q.opid;
            if (q.client) {
                const client = q.client.replace(/:.*$/, ""); // Slice off the port at the end of the string
                let str = client;
                if (this.prefs.ip && this.prefs.ip !== client) {
                    return;
                }

                if (client.match(PUBLIC_IP_REGEX)) {
                    const geo = geoip.lookup(client); // TODO: Cache geo ip look ups
                    if (geo) {
                        str += (`\n${geo.city} (${geo.region}, ${geo.country})`);
                    }
                }

                row.opid += `\n${str}`;
            }

            row.opid += `\n${formatUserAgent(q)}`;
            if (query.effectiveUsers) {
                row.opid = beautifyJson(query.effectiveUsers, 40);
            }

            row.op = `${q.op}\n${q.ns}`;
            data.push(row);
        });

        const table = new Table({
            head: ["#", "ID", "Age", "op/ns", `query`],
            colWidths,
            style: { head: ["green"] },
        });

        data.forEach(row => {
            let query = row.selectedQuery;

            if (row.q.planSummary && row.q.planSummary === "COLLSCAN") {
                // highlight collection scans in yellow. they are bad queries
                query = c.yellow(query);
            }

            if (row.q.msg) {
                query = `${c.blue.bold(row.q.msg)}\n${query ? query : ""}`;
            }

            table.push([row.idx, row.opid, row.time, row.op, query]);
        });

        if (idx === 1) {
            table.push([{ content: `No user queries. ${this.skipped} ops skipped.`, colSpan: 5 }]);
        }

        return `\n${table.toString()}`;
    }

    getFilteredQueries(queries) {
        return queries.filter(q => {
            if (this.prefs.all === true) {
                // No filtering
                return true;
            }

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
            const sanitizedQueries = filteredQueries.map(sanitizeQuery);
            const folderPath = `logs/${this.config}`;
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            const fileNameRaw = `snapshot-raw-${now}.json`
            const fileNameSanitized = `snapshot-sanitized-${now}.json`
            fs.writeFileSync(`${folderPath}/${fileNameRaw}`, JSON.stringify(filteredQueries, null, 2));
            fs.writeFileSync(`${folderPath}/${fileNameSanitized}`, JSON.stringify(sanitizedQueries, null, 2));
            this.headerText = `Wrote ${filteredQueries.length} to ${folderPath}/${sanitizedQueries}`;

            // todo: flag to log all queries > age
            // todo: log all un-indexed queries
        }
        this.prefs.snapshot = false;
    }
}

// TODO: Summary - X read queries. Y > A seconds. Z write queries
