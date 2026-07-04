import { useMemo } from "react";
import { cn } from "../../lib/utils";

interface SparklineProps {
    values: number[];
    width?: number;
    height?: number;
    className?: string;
}

const WIDTH = 72;
const HEIGHT = 18;

export const Sparkline = ({ values, width = WIDTH, height = HEIGHT, className }: SparklineProps) => {
    const points = useMemo(() => {
        if (values.length < 2) {
            return null;
        }

        const max = Math.max(...values, 1);
        const stepX = width / (values.length - 1);
        return values
            .map((value, index) => `${(index * stepX).toFixed(1)},${(height - (value / max) * height).toFixed(1)}`)
            .join(" ");
    }, [values, width, height]);

    if (!points) {
        return <div className={cn("h-[18px] w-[72px]", className)} />;
    }

    return (
        <svg
            width={width}
            height={height}
            className={cn("overflow-visible text-primary", className)}
            aria-hidden="true"
        >
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
};
