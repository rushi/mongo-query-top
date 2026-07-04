import { describe, expect, it } from "vitest";
import { avgLatencyMicros, formatMicros } from "./formatActivity";

describe("formatMicros", () => {
    it("renders zero and negatives as 0", () => {
        expect(formatMicros(0)).toBe("0");
        expect(formatMicros(-5)).toBe("0");
    });

    it("renders sub-millisecond values in microseconds", () => {
        expect(formatMicros(850)).toBe("850µs");
    });

    it("renders millisecond values", () => {
        expect(formatMicros(1500)).toBe("1.5ms");
    });

    it("renders second-scale values", () => {
        expect(formatMicros(2_500_000)).toBe("2.50s");
    });
});

describe("avgLatencyMicros", () => {
    it("returns time divided by count", () => {
        expect(avgLatencyMicros(1000, 4)).toBe(250);
    });

    it("returns 0 when count is zero", () => {
        expect(avgLatencyMicros(1000, 0)).toBe(0);
    });
});
