#!/usr/bin/env node -r esm

import _ from 'lodash';
import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import config from 'config';
import args from './lib/usage';
import Renderer from './lib/renderer';
import { sleep, clear, setupRawMode, cleanupAndExit } from './lib/helpers';

const prefs = { paused: false, reversed: false, refreshInterval: Number(args.interval), minTime: Number(args.minTime) };
let server, db;

async function run() {
    setupRawMode(prefs);

    try {
        server = await MongoClient.connect(getConfigs().uri);
        db = server.db('admin');
    } catch (err) {
        console.log(chalk.red('Error connecting to MongoDB URI: ' + args.uri));
        console.log(chalk.white.bgRed(err));
        cleanupAndExit();
    }

    try {
        let header = '';
        let body = '';
        const renderer = new Renderer(prefs, args.config);

        while (true) {
            header = renderer.renderHeader();
            if (!prefs.paused) {
                let queries = await db.command({ currentOp: 1 });
                body = renderer.renderBody(queries.inprog);
            }

            if (!prefs.paused || !prefs.finishedPausing) {
                clear();
                console.log(header, body);
                prefs.finishedPausing = prefs.paused;
            }

            if (args.once) {
                break;
            }

            const interval = prefs.paused ? 0.5 : prefs.refreshInterval;
            await sleep(interval);
        }
    } catch (err) {
        console.log(chalk.white.bgRed('Error running db.currentOp(): ' + err + ' '));
        console.log(err);
    }

    cleanupAndExit();
}

function getConfigs() {
    return config.get(args.config);
}

process.on('exit', () => {
    console.log('Closing server connection');
    server && server.close();
});

run(); // Start