import util from "util";
import humanizeDuration from "humanize-duration";

// Helper to format run time
const shortHumanizeTime = humanizeDuration.humanizer({
    spacer: "",
    delimiter: " ",
    language: "shortEn",
    languages: { shortEn: { y: "yr", mo: "mo", w: "w", d: "d", h: "h", m: "m", s: "s", ms: "ms" } } as any,
});

export default shortHumanizeTime;

export const beautifyJson = (payload: any, width: number = 180): string => {
    return util.inspect(payload, { depth: 20, colors: true, breakLength: width, sorted: true });
};
