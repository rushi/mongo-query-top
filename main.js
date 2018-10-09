const MongoClient = require('mongodb').MongoClient;
const chalk = require('chalk');
const clear = require('clear');
const sleep = require('sleep');

const Renderer = require('./lib/renderer');
const argv = require('./lib/usage');
const shouldWatch = argv.watch;
const refreshInterval = parseInt(argv.interval, 10);

let server;

async function main() {

    if (shouldWatch) {
        // This will allow us to catch if the user presses 'q' or 'Ctrl-C' and quit the app
        process.stdin.setRawMode(true); // without this, we would only get streams once enter is pressed
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (key) => {
            if (key === 'q' || key === '\u0003') {
                // q or Ctrl-C pressed. Close db connection and exit
                cleanupAndExit();
            }
        });
    }

    try {
        server = await MongoClient.connect(argv.uri);
    } catch (err) {
        console.log(chalk.red("Error connecting to MongoDB URI:", argv.uri));
        console.log(chalk.white.bgRed(err));
        cleanupAndExit(false);
    }

    try {
        let shouldContinue = true;
        while (shouldContinue) {
            let queries = await server.command({currentOp: 1});

            shouldWatch && clear(); // Clear the existing screen if user specified --watch
            console.log(Renderer.renderHeader(argv.uri, shouldWatch ? refreshInterval : null));
            console.log(Renderer.renderBody(queries.inprog));

            shouldContinue = shouldWatch;
            sleep.sleep(refreshInterval);
        }

    } catch (err) {
        console.log(chalk.white.bgRed('Error running db.currentOp(): ' + err + ' '));
    }

    cleanupAndExit();
}

function cleanupAndExit(closeConnection = true) {
    console.log('Bye');
    closeConnection && server.close()
    process.exit();
}

main();
