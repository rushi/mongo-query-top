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

const COUNT_FORMAT = new Intl.NumberFormat();

export const formatCount = (count: number): string => COUNT_FORMAT.format(count);
