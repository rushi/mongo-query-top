import { describe, expect, it } from "vitest";
import { isInternalIp } from "./isInternalIp";

describe("isInternalIp", () => {
    it("returns true for 10.x.x.x addresses", () => {
        expect(isInternalIp("10.0.0.1")).toBe(true);
        expect(isInternalIp("10.255.255.255")).toBe(true);
    });

    it("returns true for 172.16.x.x-172.31.x.x addresses", () => {
        expect(isInternalIp("172.16.0.1")).toBe(true);
        expect(isInternalIp("172.31.255.255")).toBe(true);
    });

    it("returns false for 172.x.x.x addresses outside the 16-31 range", () => {
        expect(isInternalIp("172.15.0.1")).toBe(false);
        expect(isInternalIp("172.32.0.1")).toBe(false);
    });

    it("returns true for 192.168.x.x addresses", () => {
        expect(isInternalIp("192.168.0.1")).toBe(true);
        expect(isInternalIp("192.168.255.255")).toBe(true);
    });

    it("returns false for other 192.x.x.x addresses", () => {
        expect(isInternalIp("192.169.0.1")).toBe(false);
    });

    it("returns true for loopback 127.x.x.x addresses", () => {
        expect(isInternalIp("127.0.0.1")).toBe(true);
    });

    it("returns false for public IP addresses", () => {
        expect(isInternalIp("8.8.8.8")).toBe(false);
        expect(isInternalIp("49.205.34.179")).toBe(false);
    });

    it("returns false for malformed input", () => {
        expect(isInternalIp("not.an.ip")).toBe(false);
        expect(isInternalIp("10.0.0")).toBe(false);
        expect(isInternalIp("")).toBe(false);
    });
});
