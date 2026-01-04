import util from "util";
import type { UserPreferences } from "@mongo-query-top/types";
import humanizeDuration from "humanize-duration";

// Helper to format run time
const shortHumanizeTime = humanizeDuration.humanizer({
    spacer: "",
    delimiter: " ",
    language: "shortEn",
    languages: { shortEn: { y: "yr", mo: "mo", w: "w", d: "d", h: "h", m: "m", s: "s", ms: "ms" } } as any,
});

export default shortHumanizeTime;

export const sleep = (seconds: number): Promise<void> => {
    const milliseconds = seconds * 1000 - 100; // 100 to allow for a refresh
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const clear = (): void => {
    console.clear();
    process.stdout.write("\u001b[3J\u001b[2J\u001b[1J"); // This will clear the scroll back buffer, Secret sauce from Googling a lot
};

/**
 * Setup the mode required to catch key presses
 */
export const setupRawMode = (prefs: UserPreferences): void => {
    // Check if stdin is a TTY (terminal) before setting raw mode
    if (!process.stdin.isTTY) {
        // Not running in a terminal (e.g., running through concurrently)
        // Skip raw mode setup - keyboard controls won't work
        return;
    }

    process.stdin.setRawMode(true); // without this, we would only get streams once enter is pressed
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (keyInput) => {
        let key = keyInput.toString();
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
};

export const cleanupAndExit = (): void => {
    console.log("👋 Bye");
    process.exit();
};

export const beautifyJson = (payload: any, width: number = 180): string => {
    return util.inspect(payload, { depth: 20, colors: true, breakLength: width, sorted: true });
};
