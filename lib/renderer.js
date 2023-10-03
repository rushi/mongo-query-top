import _ from 'lodash';
import chalk from 'chalk';
import Table from 'cli-table3';
import beautify from 'json-beautify';
import { format, formatISO } from 'date-fns';
import fs from 'fs';
import geoip from 'geoip-lite';
import { width, height } from 'window-size';
import shortHumanizeTime from './helpers';

const PUBLIC_IP_REGEX = /(\d+)(?<!10)\.(\d+)(?<!192\.168)(?<!172\.(1[6-9]|2\d|3[0-1]))\.(\d+)\.(\d+)/;

export default class Renderer {
    constructor(prefs, config) {
        this.prefs = prefs;
        this.config = config;
    }

    renderHeader() {
        let titles = [
            `db.currentOp() on ${chalk.bold(this.config)}`,
            `every ${chalk.bold.white(this.prefs.refreshInterval + 's')}.`,
            `Time: ${chalk.white.bold(format(new Date(), 'MMM do YYY HH:mm:ss'))}`,
            `Window Size: ${JSON.stringify(width)}x${JSON.stringify(height)}`,
        ];

        if (this.prefs.minTime > 0) {
            titles.push(chalk.blue(`Min Time: ${this.prefs.minTime}s`));
        }

        if (this.prefs.paused) {
            titles.push(chalk.italic.yellow('(paused)'));
        }

        if (this.prefs.reversed) {
            titles.push(chalk.italic.yellow('(reverse)'));
        }

        return '\n' + titles.join(' ');
    }

    renderBody(queries) {
        let colWidths = [5, 20, 10, 20]; // #, ID, Age, ns, op
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
            let query = q.command.pipeline ? q.command : q.command.query ? q.command.query : q.command.filter;
            if (!query && q.command) {
                // There's no query here but we're actually paginating using skip/limit
                query = q.command;
            }

            let row = {
                q: q,
                idx: idx++,
                time: q.secs_running > 0 ? shortHumanizeTime(q.secs_running * 1000) : '< 1s',
                query: JSON.stringify(query),
                selectedQuery: beautify(query, null, 2, maxQueryLength),
            };

            if (_.endsWith(row.query, '..."')) {
                // this is a real long query, do something
                row.selectedQuery = chalk.italic('trimmed by MongoDB:\n') + row.query;
            }

            row.opid = q.opid;
            if (q.client) {
                let client = q.client.replace(/:.*$/, ''); // Slice off the port at the end of the string
                let str = chalk.grey(client);
                if (this.prefs.ip && this.prefs.ip !== client) {
                    return;
                }
                if (client.match(PUBLIC_IP_REGEX)) {
                    const geo = geoip.lookup(client); // TODO: Cache geo ip look ups
                    if (geo) {
                        str += chalk.bold.grey(`\n${geo.city} (${geo.region}, ${geo.country})`);
                    }
                }

                row.opid += '\n' + str;
            }

            let appName;
            if (q.clientMetadata) {
                if (q.clientMetadata.driver && q.clientMetadata.driver.name) {
                    row.opid += '\n' + chalk.grey(q.clientMetadata.driver.name);
                }
                if (q.clientMetadata.application && q.clientMetadata.application.name) {
                    appName = chalk.bold.grey(q.clientMetadata.application.name);
                }
            }

            if (!_.isEmpty(appName) && q.appName) {
                appName = chalk.bold.grey(q.appName);
            }

            if (!_.isEmpty(appName)) {
                row.opid += '\n' + appName;
            }

            row.op = q.op + '\n' + q.ns;
            if (row.selectedQuery) {
                row.selectedQueryLength = row.selectedQuery.split('\n').length;
            }

            data.push(row);
        });

        let table = new Table({
            head: ['#', 'ID', 'Age', 'op/ns', `query`],
            colWidths: colWidths,
            style: { head: ['green'] },
        });

        _.each(data, row => {
            let query = row.selectedQuery;

            if (row.q.planSummary && row.q.planSummary === 'COLLSCAN') {
                // highlight collection scans in yellow. they are bad queries
                query = chalk.yellow(query);
            }

            if (row.q.msg) {
                query = chalk.blue.bold(row.q.msg) + '\n' + (query ? query : '');
            }

            table.push([row.idx, row.opid, row.time, row.op, query]);
        });

        if (idx === 1) {
            table.push([{ content: 'No queries running', colSpan: 5 }]);
        }

        return '\n' + table.toString();
    }

    shouldSkipQuery(q) {
        const isIndex = q.ns && q.ns.indexOf('system.indexes') >= 0;
        return (
            (q.command && q.op == 'command' && q.ns == 'admin.$cmd') ||
            (q && q.appName && q.appName.match(/MongoDB Monitoring Module/i)) ||
            (q.command && (q.command.hello === 1 || q.command.hello === true)) ||
            (q.command && q.command.isMaster === 1) ||
            // Skip the db.currentOp command
            (q.command && q.command.currentOp && q.command.currentOp === 1) ||
            // Skip the replication command
            q.ns == 'local.oplog.rs' ||
            (q.op == 'none' && !isIndex) ||
            // Valid queries which don't meet minimum running criteria
            q.secs_running < this.prefs.minTime
        );
    }

    getFilteredQueries(queries) {
        return queries.filter(q => !this.shouldSkipQuery(q));
    }

    save(queries) {
        const filteredQueries = this.getFilteredQueries(queries);
        if (filteredQueries.length > 0) {
            const filename = `mongodb-query-top-snapshot-${formatISO(new Date(), { format: 'basic' })}.json`;
            const data = JSON.stringify(filteredQueries, null, 2);
            fs.writeFile(filename, data, () => {});
        }
        this.prefs.snapshot = false;
    }
}
