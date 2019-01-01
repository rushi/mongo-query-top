const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const chalk = require('chalk');
const clear = require('clear');
const config = require('config');

const Renderer = require('./lib/renderer');
const argv = require('./lib/usage');
const sleep = require('./lib/helpers').sleep;
const shouldWatch = argv.watch;
const refreshInterval = parseInt(argv.interval, 10);

let isPaused = false;
let server;

(async function () {

    if (shouldWatch) {
        // This will allow us to catch if the user presses 'q' or 'Ctrl-C' and quit the app
        process.stdin.setRawMode(true); // without this, we would only get streams once enter is pressed
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', key => {
            if (key === 'q' || key === '\u0003') {
                // q or Ctrl-C pressed. Close db connection and exit
                cleanupAndExit();
            }

            if (key.toLowerCase() === 'p') {
                isPaused = !isPaused;
            }
        });
    }

    try {
        server = await MongoClient.connect(getConfigs().uri);
    } catch (err) {
        console.log(chalk.red("Error connecting to MongoDB URI: " + argv.uri));
        console.log(chalk.white.bgRed(err));
        cleanupAndExit(false);
    }

    try {
        let shouldContinue = true;
        let header = body = '';
        while (shouldContinue) {
            let queries = await server.command({currentOp: 1});
            shouldWatch && clear(); // Clear the existing screen if user specified --watch

            if (!isPaused) {
                const interval = shouldWatch ? refreshInterval : null;
                header = Renderer.renderHeader(interval);
                body = Renderer.renderBody(queries.inprog);
            }

            let headerLine = header;
            if (isPaused) {
                headerLine += chalk.italic.yellow('(paused)');
            }
            console.log(headerLine);
            console.log(body);

            shouldContinue = shouldWatch;
            await sleep(refreshInterval);
        }

    } catch (err) {
        console.log(chalk.white.bgRed('Error running db.currentOp(): ' + err + ' '));
    }

    cleanupAndExit();
})();

function cleanupAndExit(closeConnection = true) {
    console.log('Bye');
    closeConnection && server && server.close()
    process.exit();
}

function getConfigs() {
    const savedConfig = (argv.config) ? config.get(argv.config) : '';
    return _.extend(argv, savedConfig);
}