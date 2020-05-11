import humanizeDuration from 'humanize-duration';

// Helper to format run time
export default humanizeDuration.humanizer({
    spacer: '',
    delimiter: ' ',
    language: 'shortEn',
    languages: { shortEn: { y: 'yr', mo: 'mo', w: 'w', d: 'd', h: 'h', m: 'm', s: 's', ms: 'ms' } },
});

export function sleep(seconds) {
    let milliseconds = seconds * 1000 - 100; // 100 to allow for a refresh
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function clear() {
    console.clear();
    process.stdout.write('\u001b[3J\u001b[2J\u001b[1J'); // This will clear the scrollback buffer, Secret sauce from Googling a lot
}

/**
 * Setup the mode required to catch key presses
 */
export function setupRawMode(prefs) {
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

export function cleanupAndExit() {
    console.log('👋 Bye');
    process.exit();
}