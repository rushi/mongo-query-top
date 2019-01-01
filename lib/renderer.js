const _ = require('lodash');
const chalk = require('chalk');
const Table = require('cli-table2');
const beautify = require("json-beautify");
const moment = require('moment');
const windowSize = require('window-size');
const shortHumanizeTime = require('./helpers').shortHumanizeTime;

class Renderer
{
    static renderHeader(refreshInterval)
    {
        let titles = [
            `db.currentOp()`,
            refreshInterval ? `Refreshing every ${chalk.bold.white(refreshInterval + "s")}.` : '',
            `Time: ${chalk.white.bold(moment().format('MMMM Do YYYY, h:mm:ss a'))}`
        ];

        return "\n" + titles.join(" ") + " ";
    }

    static renderBody(queries)
    {
        let table = new Table({
            head: ['#', 'ID', 'Age', 'op', 'ns', 'query'],
            style: {head: ['green']}
        });

        // Sort queries in descending order of run time. Longest running at the top
        queries = _.reverse(_.sortBy(queries, (q) => { return q.microsecs_running; }));

        let idx = 1;
        _.each(queries, q => {
            if (q.op == 'command' && q.ns == 'admin.$cmd' || q.ns == 'local.oplog.rs' || q.op == 'none') {
                // This query is this command itself, skip it
                return;
            }

            let query = beautify(q.query, null, 2, windowSize.width / 2);
            if (_.endsWith(query, '..."')) {
                // this is a real long query, do something
                query = query.slice(0, 100) + '..." ' + chalk.italic("(trimmed)");
            }

            if (q.planSummary && q.planSummary === 'COLLSCAN') {
                // highlight collection scans in yellow. they are bad queries
                query = chalk.bold.yellow(query);
            }

            if (q.msg) {
                query = chalk.bold.white(q.msg) + "\n\n" + query;
            }

            let opid = q.opid;
            if (q.client) {
                opid += "\n" + chalk.grey(q.client);
            }
            if (q.appName) {
                opid += "\n" + chalk.grey(q.appName);
            }

            let time = shortHumanizeTime(q.secs_running * 1000);
            table.push([idx++, opid, time, q.op, q.ns, query]);
        });

        if (idx === 1) {
            table.push([{content: 'No queries running, great!', colSpan: 6}]);
        }

        return "\n" + table.toString();
    }
}

module.exports = Renderer;
