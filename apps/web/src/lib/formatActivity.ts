import type { ActivityMetric, ActivityMode, TopNode } from "@mongo-query-top/types";

export const formatMicros = (micros: number): string => {
    if (micros <= 0) {
        return "0";
    }
    if (micros >= 1_000_000) {
        return `${(micros / 1_000_000).toFixed(2)}s`;
    }
    if (micros >= 1_000) {
        return `${(micros / 1_000).toFixed(1)}ms`;
    }
    return `${Math.round(micros)}µs`;
};

export const avgLatencyMicros = (time: number, count: number): number => {
    if (count <= 0) {
        return 0;
    }
    return time / count;
};

export const metricTime = (metric: ActivityMetric, mode: ActivityMode): number =>
    mode === "diff" ? metric.deltaTime : metric.cumTime;

export const metricCount = (metric: ActivityMetric, mode: ActivityMode): number =>
    mode === "diff" ? metric.deltaCount : metric.cumCount;

export const getNodeRole = (nodes: TopNode[], host: string | undefined): TopNode["role"] =>
    nodes.find((node) => node.host === host)?.role ?? "primary";

const COUNT_FORMAT = new Intl.NumberFormat();

export const formatCount = (count: number): string => COUNT_FORMAT.format(count);
