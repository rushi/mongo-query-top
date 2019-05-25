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
        let table = new Table({
            head: ['#', 'ID', 'Age', 'op', 'ns', 'query'],
            colWidths: colWidths,
            style: {head: ['green']}
        });

        // Sort queries in ascending order of run time. Longest running at the bottom for easy diagnosis
        queries = _.sortBy(queries, (q) => { return q.microsecs_running; });
        queries = queries.filter(q => !this.shouldSkipQuery(q)); // remove skippable queries

        let idx = 1;
        const maxRows = 6; // Anything more than this and we don't beautify queries
        _.each(queries, q => {
            let query = JSON.stringify(q.query);
            if (queries.length < maxRows) {
                query = beautify(q.query, null, 2, maxQueryLength);
                if (query.split("\n").length > 10 && queries.length > 5) {
                    // The beautified version is just too long which will most likely produce a scroll. Compact it
                    query = JSON.stringify(q.query);
                }
            }

            if (_.endsWith(query, '..."')) {
                // this is a real long query, do something
                query = chalk.italic("trimmed by MongoDB:\n") + query;
            }

            if (q.planSummary && q.planSummary === 'COLLSCAN') {
                // highlight collection scans in yellow. they are bad queries
                query = chalk.yellow(query);
            }

            if (q.msg) {
                query = chalk.white(q.msg) + "\n\n" + query;
            }

            let opid = q.opid;
            if (q.client) {
                opid += "\n" + chalk.grey(q.client);
            }
            if (q.appName) {
                opid += "\n" + chalk.grey(q.appName);
            }

            let time = q.secs_running > 0 ? shortHumanizeTime(q.secs_running * 1000) : "< 1s";
            table.push([idx++, opid, time, q.op, q.ns, query]);
        });

        if (idx === 1) {
            table.push([{content: 'No queries running, great!', colSpan: 6}]);
        }

        return "\n" + table.toString();
    }

    shouldSkipQuery(q)
    {
        return q.op == 'command' && q.ns == 'admin.$cmd' || q.ns == 'local.oplog.rs' || q.op == 'none';
    }
}

module.exports = Renderer;
