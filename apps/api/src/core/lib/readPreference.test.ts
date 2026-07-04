import { describe, expect, it } from "vitest";
import { parseReadPreference } from "./readPreference.js";

describe("parseReadPreference", () => {
    it("passes through valid modes", () => {
        expect(parseReadPreference("primary")).toBe("primary");
        expect(parseReadPreference("secondaryPreferred")).toBe("secondaryPreferred");
    });

    it("defaults to primary when undefined", () => {
        expect(parseReadPreference(undefined)).toBe("primary");
    });

    it("defaults to primary for invalid or unsupported values", () => {
        expect(parseReadPreference("secondary")).toBe("primary");
        expect(parseReadPreference("nearest")).toBe("primary");
        expect(parseReadPreference("")).toBe("primary");
    });
});
