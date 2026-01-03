import chalk from "chalk";
import Table from "cli-table3";
import dayjs from "dayjs";
import windowSize from "window-size";
import type { ProcessedQuery, QuerySummary } from "../services/QueryService.js";
import type { UserPreferences } from "../types/index.js";
import { beautifyJson } from "./helpers.js";

export default class ConsoleRenderer {
    private prefs: UserPreferences;
    private config: string;
    private feedbackMsg: string;

    constructor(prefs: UserPreferences, config: string) {
        this.prefs = prefs;
        this.config = config;
        this.feedbackMsg = "";
    }

    renderHeader(): string {
        const now = dayjs().format("MMM D HH:mm:ss");
        const { width, height } = windowSize;

        let header = `${chalk.bold(this.config)}`;
        header += ` (refresh: ${chalk.green(this.prefs.refreshInterval)}s`;
        header += `, min time: ${chalk.red(this.prefs.minTime)}s`;
        header += `, ${now}`;
        header += `, ${width}x${height})`;

        if (this.prefs.paused) {
            header += chalk.yellow(" (paused)");
        }

        if (this.prefs.reversed) {
            header += chalk.yellow(" (reverse)");
        }

        if (this.prefs.all) {
            header += chalk.yellow(" (showing all)");
        }

        if (this.feedbackMsg) {
            header += `\n${chalk.green(this.feedbackMsg)}`;
            this.feedbackMsg = ""; // Clear after displaying
        }

        return header;
    }

    renderBody(queries: ProcessedQuery[], summary: QuerySummary): string {
        if (queries.length === 0) {
            return chalk.gray("No user queries found. Press 'a' to show all queries.");
        }

        const { width } = windowSize;

        // Table column widths
        const colWidths = [5, 25, 9, 25];
        const maxQueryLength = width - colWidths.reduce((a, b) => a + b, 0) - 8;

        const table = new Table({
            head: [chalk.bold("#"), chalk.bold("ID"), chalk.bold("Age"), chalk.bold("op/ns"), chalk.bold("query")],
            colWidths,
            style: { head: [], border: [] },
            wordWrap: true,
        });

        // Sort queries (already sorted by service, but apply reverse if needed)
        const sortedQueries = this.prefs.reversed ? [...queries].reverse() : queries;

        for (const q of sortedQueries) {
            const opNs = `${q.operation}\n${chalk.gray(q.namespace)}`;

            // Format query
            let query = beautifyJson(q.query, maxQueryLength);

            // Truncate if too long
            if (query.length > maxQueryLength) {
                query = query.slice(0, maxQueryLength - 3) + "...";
            }

            // Highlight COLLSCAN queries
            if (q.isCollscan) {
                query = chalk.yellow(query);
            }

            table.push([chalk.gray(q.idx.toString()), q.opid.toString(), q.runtime_formatted, opNs, query]);
        }

        // Add summary row
        const summaryParts = [];
        if (summary.operations && Object.keys(summary.operations).length > 0) {
            const opsStr = Object.entries(summary.operations)
                .map(([op, count]) => `${count}x ${op}`)
                .join(", ");
            summaryParts.push(`Ops: ${opsStr}`);
        }

        if (summary.collections && Object.keys(summary.collections).length > 0) {
            const collectionsStr = Object.entries(summary.collections)
                .map(([coll, count]) => `${count}x ${coll}`)
                .join(", ");
            summaryParts.push(`Collections: ${collectionsStr}`);
        }

        if (summary.unindexedCount > 0) {
            summaryParts.push(chalk.yellow(`${summary.unindexedCount} COLLSCAN`));
        }

        summaryParts.push(`Total: ${summary.totalQueries}`);

        const summaryText = summaryParts.join(" | ");

        return table.toString() + "\n\n" + chalk.bold("Summary: ") + summaryText;
    }

    setFeedbackMessage(msg: string): void {
        this.feedbackMsg = msg;
    }
}
