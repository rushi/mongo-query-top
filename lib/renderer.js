const _ = require('lodash');
const chalk = require('chalk');
const Table = require('cli-table3');
const beautify = require("json-beautify");
const moment = require('moment');
const windowSize = require('window-size');
const shortHumanizeTime = require('./helpers').shortHumanizeTime;

class Renderer
{
    constructor(prefs, config) {
        this.prefs = prefs;
        this.config = config;
    }

    renderHeader()
    {
        let titles = [
            `db.currentOp() on ${chalk.bold(this.config)}`,
            `Refreshing every ${chalk.bold.white(this.prefs.refreshInterval + "s")}.`,
            `Time: ${chalk.white.bold(moment().format('MMMM Do YYYY, h:mm:ss a'))}`,
            `Window Size: ${JSON.stringify(windowSize.width)}x${JSON.stringify(windowSize.height)}`
        ];

        if (this.prefs.minTime > 0) {
            titles.push(chalk.blue(`Min Time: ${this.prefs.minTime}s`))
        }

        if (this.prefs.paused) {
            titles.push(chalk.italic.yellow('(paused)'));
        }

        if (this.prefs.reversed) {
            titles.push(chalk.italic.yellow('(reverse)'));
        }

        return "\n" + titles.join(" ");
    }

    renderBody(queries)
    {
        let colWidths = [5, 20, 10, 10, 20]; // #, ID, Age, ns, op
        const maxQueryLength = windowSize.width - _.sum(colWidths) - 8;
        colWidths.push(maxQueryLength);

        // Sort queries in ascending order of run time. Longest running at the bottom for easy diagnosis
        queries = _.sortBy(queries, (q) => { return q.microsecs_running; });
        queries = queries.filter(q => !this.shouldSkipQuery(q)); // remove skippable queries

        let idx = 1;
        const maxLines = windowSize.height - 10 - queries.length; // minus height of headers, footers and lines
        const data = [];
        let lineCount = 0;
        _.each(queries, q => {
            let row = {
                q: q,
                idx: idx++,
                time: q.secs_running > 0 ? shortHumanizeTime(q.secs_running * 1000) : "< 1s",
                query: JSON.stringify(q.query),
                selectedQuery: beautify(q.query, null, 2, maxQueryLength)
            };

            if (_.endsWith(row.query, '..."')) {
                // this is a real long query, do something
                row.selectedQuery = chalk.italic("trimmed by MongoDB:\n") + row.query;
            }

            row.opid = q.opid;
            if (q.client) {
                row.opid += "\n" + chalk.grey(q.client);
            }
            if (q.appName) {
                row.opid += "\n" + chalk.grey(q.appName);
            }

            row.selectedQueryLength = row.selectedQuery.split('\n').length;
            lineCount += row.selectedQueryLength;

            data.push(row);
        })

        let modifiedCount = 0;
        for (let d in data) {
            if (lineCount < maxLines) {
                break;
            }

            const row = data[d];
            row.selectedQuery = row.query;
            lineCount = (lineCount - row.selectedQueryLength) + row.opid.split('\n').length;
            modifiedCount++;
        }
        
        let table = new Table({
            head: ['#', 'ID', 'Age', 'op', 'ns', `query MC: ${chalk.blue(modifiedCount)} < ${queries.length} LC: ${chalk.yellow(lineCount)} < ${maxLines}`],
            colWidths: colWidths,
            style: {head: ['green']}
        });

        _.each(data, row => {
            let query = row.selectedQuery;

            if (row.q.planSummary && row.q.planSummary === 'COLLSCAN') {
                // highlight collection scans in yellow. they are bad queries
                query = chalk.yellow(query);
            }

            if (row.q.msg) {
                query = chalk.blue.bold(row.q.msg) + "\n" + query;
            }

            table.push([row.idx, row.opid, row.time, row.q.op, row.q.ns, query]);
        });

        if (idx === 1) {
            table.push([{content: 'No queries running, great!', colSpan: 6}]);
        }

        return "\n" + table.toString();
    }

    shouldSkipQuery(q)
    {
        return q.op == 'command' && q.ns == 'admin.$cmd' || q.ns == 'local.oplog.rs' || q.op == 'none' || q.secs_running < this.prefs.minTime;
    }
}

module.exports = Renderer;
