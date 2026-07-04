import { describe, expect, it } from "vitest";
import { buildDirectUri } from "./directUri.js";

describe("buildDirectUri", () => {
    it("pins a replica-set uri to a single host with directConnection", () => {
        const uri = "mongodb://user:pass@h1:27017,h2:27017,h3:27017/db?replicaSet=rs&authSource=admin";
        expect(buildDirectUri(uri, "h2:27017")).toBe(
            "mongodb://user:pass@h2:27017/db?authSource=admin&directConnection=true",
        );
    });

    it("works without credentials", () => {
        const uri = "mongodb://h1:27017,h2:27017/db?replicaSet=rs";
        expect(buildDirectUri(uri, "h1:27017")).toBe("mongodb://h1:27017/db?directConnection=true");
    });

    it("keeps an empty database path", () => {
        const uri = "mongodb://user:pass@h1:27017,h2:27017/?replicaSet=rs&authSource=admin";
        expect(buildDirectUri(uri, "h2:27017")).toBe(
            "mongodb://user:pass@h2:27017/?authSource=admin&directConnection=true",
        );
    });

    it("throws for mongodb+srv uris (cannot be pinned by host)", () => {
        expect(() => buildDirectUri("mongodb+srv://user:pass@cluster.example.net/db", "h1:27017")).toThrow();
    });
});
