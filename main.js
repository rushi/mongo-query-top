#!/usr/bin/env node

const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const chalk = require('chalk');
const clear = require('clear');
const config = require('config');

const Renderer = require('./lib/renderer');
const argv = require('./lib/usage');
const sleep = require('./lib/helpers').sleep;

const prefs = {paused: false, reversed: false, refreshInterval: Number(argv.interval), minTime: Number(argv.minTime)};
let server;

(async function () {

    setupRawMode();

    try {
        server = await MongoClient.connect(getConfigs().uri);
    } catch (err) {
        console.log(chalk.red("Error connecting to MongoDB URI: " + argv.uri));
        console.log(chalk.white.bgRed(err));
        cleanupAndExit(false);
    }

    try {
        let header = body = '';
        const renderer = new Renderer(prefs, argv.config);

        while (true) {
            header = renderer.renderHeader();
            if (!prefs.paused) {
                // we are not paused so let's fetch the queries and update the display of the body
                let queries = await server.command({currentOp: 1});
                body = renderer.renderBody(queries.inprog);
            }

            clear(); // Clear the existing screen
            console.log(header);
            console.log(body);

            const sleepTime = (prefs.refreshInterval * 1000) - 100; // subtract 100ms to run a query and bring it down
            await sleep(sleepTime);
        }

    } catch (err) {
        console.log(chalk.white.bgRed('Error running db.currentOp(): ' + err + ' '));
    }

    cleanupAndExit();
})();

/**
 * Setup the mode required to catch key presses
 */
function setupRawMode() {
    process.stdin.setRawMode(true); // without this, we would only get streams once enter is pressed
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', key => {
        if (key === 'q' || key === '\u0003') {
            // q or Ctrl-C pressed. Close db connection and exit
            cleanupAndExit();
        }

        key = key.toLowerCase();
        if (key === 'p') {
            prefs.paused = !prefs.paused;
        }

        if (key === 'r') {
            prefs.reversed = !prefs.reversed;
        }
    });
}

function cleanupAndExit(closeConnection = true) {
    console.log('Bye');
    closeConnection && server && server.close()
    process.exit();
}

function getConfigs() {
    const savedConfig = (argv.config) ? config.get(argv.config) : '';
    return _.extend(argv, savedConfig);
}