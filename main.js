const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const chalk = require('chalk');
const clear = require('clear');
const sleep = require('sleep');
const config = require('config');

const Renderer = require('./lib/renderer');
const argv = require('./lib/usage');
const shouldWatch = argv.watch;
const refreshInterval = parseInt(argv.interval, 10);

let server;

function cleanupAndExit(closeConnection = true) {
    console.log('Bye');
    closeConnection && server && server.close()
    process.exit();
}

function getConfigs() {
    const savedConfig = (argv.config) ? config.get(argv.config) : '';
    return _.extend(argv, savedConfig);
}

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
        while (shouldContinue) {
            let queries = await server.command({currentOp: 1});

            shouldWatch && clear(); // Clear the existing screen if user specified --watch
            const interval = shouldWatch ? refreshInterval : null;
            console.log(Renderer.renderHeader(interval));
            console.log(Renderer.renderBody(queries.inprog));

            shouldContinue = shouldWatch;
            sleep.sleep(refreshInterval);
        }

    } catch (err) {
        console.log(chalk.white.bgRed('Error running db.currentOp(): ' + err + ' '));
    }

    cleanupAndExit();
})();