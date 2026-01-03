import { promises as fs } from "fs";
import c from "chalk";
import Table from "cli-table3";
import dayjs from "dayjs";
import geoip from "geoip-lite";
import stringify from "json-stringify-pretty-compact";
import { sortBy, sum } from "lodash-es";
import values from "window-size";
import type { GeoLocation, MongoQuery, UserPreferences } from "../types/index.js";
import shortHumanizeTime, { beautifyJson } from "./helpers.js";
import { formatUserAgent, sanitizeQuery, shouldSkipQuery, summarizeArray } from "./queryProcessor.js";

const { height, width } = values;

const PUBLIC_IP_REGEX = /(\d+)(?<!10)\.(\d+)(?<!192\.168)(?<!172\.(1[6-9]|2\d|3[0-1]))\.(\d+)\.(\d+)/;
const bold = c.bold;

export default class Renderer {
    private prefs: UserPreferences;
    private config: string;
    private skipped: number = 0;
    private headerText: string = "";
    private geoCache: Map<string, GeoLocation | null> = new Map(); // NEW: GeoIP cache

    constructor(prefs: UserPreferences, config: string) {
        this.prefs = prefs;
        this.config = config;
    }

    renderHeader(): string {
        const titles = [
            `db.currentOp() on ${bold(this.config)}`,
            `refresh: ${bold.green(`${this.prefs.refreshInterval}s`)}`,
            `minTime: ${bold.green(`${this.prefs.minTime}s`)}.`,
            `Time: ${dayjs(new Date()).format("MMM DD HH:mm:ss")}`,
            c.gray(`Window Size: ${JSON.stringify(width)}x${JSON.stringify(height)}`),
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

    renderBody(queries: MongoQuery[]): string {
        this.skipped = 0;
        const colWidths = [5, 25, 9, 25]; // #, ID, Age, ns, op
        const maxQueryLength = width - sum(colWidths) - 8;
        colWidths.push(maxQueryLength);

        // Sort queries in ascending order of run time. Longest running at the bottom for easy diagnosis
        let filteredQueries = sortBy(queries, (q) => q.microsecs_running);
        // Use native reverse
        filteredQueries = this.prefs.reversed ? filteredQueries.reverse() : filteredQueries;
        filteredQueries = this.getFilteredQueries(filteredQueries);

        const summaryRow = { count: 0, op: [] as string[], ns: [] as string[], userAgent: [] as string[], badIndex: 0 };

        let idx = 1;
        const data: any[] = [];
        // Use native for...of instead of _.each
        for (const q of filteredQueries) {
            const query = sanitizeQuery(q);
            const row: any = {
                q,
                idx: idx++,
                time: q.secs_running > 0 ? shortHumanizeTime(q.secs_running * 1000) : "< 1s",
                query: stringify(query),
                selectedQuery: beautifyJson(query, maxQueryLength),
            };

            if (q.secs_running >= this.prefs.log) {
                // Fire and forget - don't block rendering
                this.saveQuery(q, q.ns).catch((err) => console.error("Error saving query:", err));
            }

            // Use native endsWith
            if (row.query.endsWith('..."')) {
                // this is a real long query, do something
                row.selectedQuery = c.italic("trimmed by MongoDB:\n") + row.query;
            }

            row.opid = q.opid;
            if (q.client) {
                const client = q.client.replace(/:.*$/, ""); // Slice off the port at the end of the string
                let str = client;
                if (this.prefs.ip && this.prefs.ip !== client) {
                    continue;
                }

                if (client.match(PUBLIC_IP_REGEX)) {
                    const geo = this.lookupGeo(client); // NOW CACHED!
                    if (geo) {
                        str += `\n${geo.city} (${geo.region}, ${geo.country})`;
                    }
                }

                row.opid += `\n${str}`;
            }

            row.opid += `\n${formatUserAgent(q)}`;
            if ((query as any).effectiveUsers) {
                row.opid += `\n${c.blue((query as any).effectiveUsers.map((e: any) => Object.values(e).join("@")))}`;
            }

            row.op = `${q.op}\n${q.ns.split(".").join("\n> ")}`;
            data.push(row);
        }

        for (const q of queries) {
            if (shouldSkipQuery(q)) {
                continue;
            }

            summaryRow.count++;
            if (q.op !== "command" && q.op !== "getmore") {
                summaryRow.op.push(c.blue(q.op));
            } else {
                summaryRow.op.push(q.op);
            }

            if (q.ns !== "admin.$cmd" && q.ns !== "local.oplog.rs") {
                summaryRow.ns.push(c.blue(q.ns));
            } else {
                summaryRow.ns.push(q.ns);
            }

            summaryRow.userAgent.push(formatUserAgent(q));
            if (q.planSummary === "COLLSCAN" && !shouldSkipQuery(q)) {
                summaryRow.badIndex++;
            }
        }

        const table = new Table({
            head: ["#", "ID", "Age", "op/ns", `query`],
            colWidths,
            style: { head: ["green"] },
        });

        data.forEach((row) => {
            let query = row.selectedQuery;

            if (row.q.planSummary && row.q.planSummary === "COLLSCAN") {
                // highlight collection scans in yellow. they are bad queries
                query = c.yellow(query);
                // Fire and forget - don't block rendering
                this.saveQuery(row.q, row.q.ns, "COLLSCAN").catch((err) =>
                    console.error("Error saving COLLSCAN query:", err),
                );
            }

            if (row.q.msg) {
                query = `${c.blue.bold(row.q.msg)}\n${query ? query : ""}`;
            }

            if (row.q.waitingForLock) {
                query = `${c.blue("Waiting for lock:")}\n${query}`;
            }

            table.push([row.idx, row.opid, row.time, row.op, query]);
        });

        if (summaryRow.count === 0) {
            table.push([{ content: `No user queries to show. ${this.skipped} ignored.`, colSpan: 5 }]);
        }

        if (summaryRow.count > 0) {
            // More than 3 rows, we show a summary
            const opStr = summarizeArray(summaryRow.op);
            const nsStr = summarizeArray(summaryRow.ns);
            const countSummary = `${data.length}/${queries.length}`;
            let summary = `${c.underline(`Showing ${bold(countSummary)} queries`)}\n OP: ${opStr}`;
            summary += `\n Collection: ${nsStr}`;
            summary += `\n Clients: ${summarizeArray(summaryRow.userAgent)}`;
            if (summaryRow.badIndex > 0) {
                summary += `\n ${c.yellow(summaryRow.badIndex)} un-indexed queries`;
            }
            table.push([{ content: summary, colSpan: 5 }]);
        }

        if (data.length > 0) {
            const terminalTitle = `${data.length}/${queries.length} queries`;
            process.stdout.write(String.fromCharCode(27) + "]0;" + terminalTitle + String.fromCharCode(7));
        } else {
            process.stdout.write(
                String.fromCharCode(27) + "]0;" + `Mongo Top on ${this.config}` + String.fromCharCode(7),
            );
        }

        return `\n${table.toString()}`;
    }

    private getFilteredQueries(queries: MongoQuery[]): MongoQuery[] {
        if (this.prefs.all === true) {
            return queries;
        }

        return queries.filter((q) => {
            if (shouldSkipQuery(q)) {
                this.skipped++;
                return false;
            }

            return true;
        });
    }

    // NEW: Cached GeoIP lookup
    private lookupGeo(ip: string): GeoLocation | null {
        if (!this.geoCache.has(ip)) {
            this.geoCache.set(ip, geoip.lookup(ip));
        }
        return this.geoCache.get(ip) || null;
    }

    async save(queries: MongoQuery[]): Promise<void> {
        const filteredQueries = this.getFilteredQueries(queries);
        const now = dayjs().format();
        if (filteredQueries.length > 0) {
            const folderPath = `logs/${this.config}`;

            // Use async file operations
            try {
                await fs.access(folderPath);
            } catch {
                await fs.mkdir(folderPath, { recursive: true });
            }

            const fileNameRaw = `queries-raw-${now}.json`;
            await fs.writeFile(`${folderPath}/${fileNameRaw}`, JSON.stringify(filteredQueries, null, 2));

            const fileNameSanitized = `queries-sanitized-${now}.json`;
            const sanitizedQueries = filteredQueries.map((q) => sanitizeQuery(q, false));
            await fs.writeFile(`${folderPath}/${fileNameSanitized}`, JSON.stringify(sanitizedQueries, null, 2));
            this.headerText = `Wrote ${filteredQueries.length} queries to ${folderPath}`;
        }

        this.prefs.snapshot = false;
    }

    async saveQuery(query: MongoQuery, collection: string, type: string = ""): Promise<void> {
        const folderPath = `logs/${this.config}`;

        // Use async file operations
        try {
            await fs.access(folderPath);
        } catch {
            await fs.mkdir(folderPath, { recursive: true });
        }

        const rawFolderPath = folderPath + "/raw/";
        try {
            await fs.access(rawFolderPath);
        } catch {
            await fs.mkdir(rawFolderPath, { recursive: true });
        }

        const rawQuery = query;
        type = type ? `${type}-` : type;
        const fileNameRaw = `${rawFolderPath}/query-${rawQuery.opid}-${collection}-${type}raw.json`;
        await fs.writeFile(fileNameRaw, JSON.stringify(rawQuery, null, 2));

        const sanitized = { ...sanitizeQuery(query, false), secs_running: rawQuery.secs_running };
        const filenameSanitized = `${folderPath}/query-${rawQuery.opid}-${collection}-${type}sanitized.json`;
        await fs.writeFile(filenameSanitized, JSON.stringify(sanitized, null, 2));

        this.headerText = `Wrote query ${rawQuery.opid} to disk`;
    }
}

// TODO: Summary - X read queries. Y > A seconds. Z write queries
