import humanizeDuration from "humanize-duration";
import util from "util";

// Helper to format run time
export default humanizeDuration.humanizer({
    spacer: "",
    delimiter: " ",
    language: "shortEn",
    languages: { shortEn: { y: "yr", mo: "mo", w: "w", d: "d", h: "h", m: "m", s: "s", ms: "ms" } },
});

export function sleep(seconds) {
    const milliseconds = seconds * 1000 - 100; // 100 to allow for a refresh
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function clear() {
    console.clear();
    process.stdout.write("\u001b[3J\u001b[2J\u001b[1J"); // This will clear the scroll back buffer, Secret sauce from Googling a lot
}

/**
 * Setup the mode required to catch key presses
 */
export function setupRawMode(prefs) {
    process.stdin.setRawMode(true); // without this, we would only get streams once enter is pressed
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", key => {
        if (key === "q" || key === "\u0003") {
            // q or Ctrl-C pressed. Close db connection and exit
            cleanupAndExit();
        }

        key = key.toLowerCase();
        if (key === "p") {
            prefs.paused = !prefs.paused;
        }

        if (key === "r") {
            prefs.reversed = !prefs.reversed;
        }

        if (key === "s") {
            prefs.snapshot = true;
        }

        if (key === "a") {
            prefs.all = !prefs.all;
        }
    });
}

export function cleanupAndExit() {
    console.log("👋 Bye");
    process.exit();
}

export function beautifyJson(payload, width = 180) {
    return util.inspect(payload, { depth: 20, colors: true, breakLength: width, sorted: true });
}
