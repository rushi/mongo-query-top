import type { ActivityMode } from "@mongo-query-top/types";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const MODES: { value: ActivityMode; label: string }[] = [
    { value: "diff", label: "PER_INTERVAL" },
    { value: "cumulative", label: "CUMULATIVE" },
];

interface ActivityControlsProps {
    showAll: boolean;
    mode: ActivityMode;
    onModeChange: (mode: ActivityMode) => void;
    onToggleShowAll: () => void;
}

export const ActivityControls = ({ showAll, mode, onModeChange, onToggleShowAll }: ActivityControlsProps) => {
    return (
        <div className="flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">VIEW:</span>
                {MODES.map(({ value, label }) => (
                    <Button
                        key={value}
                        variant={mode === value ? "default" : "outline"}
                        className="h-8 border-2 font-mono text-xs tracking-wide uppercase"
                        onClick={() => onModeChange(value)}
                    >
                        {label}
                    </Button>
                ))}
            </div>
            <Button
                variant="outline"
                className={cn(
                    "h-8 border-2 font-mono text-xs tracking-wide uppercase",
                    showAll && "border-primary text-primary",
                )}
                onClick={onToggleShowAll}
            >
                {showAll ? "☑" : "☐"} SHOW_SYSTEM
            </Button>
        </div>
    );
};
