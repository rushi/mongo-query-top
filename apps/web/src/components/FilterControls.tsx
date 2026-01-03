import { ArrowCounterClockwiseIcon, CheckIcon, FloppyDiskIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { apiClient } from "../utils/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export const FilterControls = () => {
    const {
        serverId,
        minTime,
        refreshInterval,
        showAll,
        ipFilter,
        setMinTime,
        setRefreshInterval,
        toggleShowAll,
        setIpFilter,
        resetFilters,
    } = useUrlPreferences();

    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            await apiClient.post(`/api/queries/${serverId}/snapshot?minTime=${minTime}`);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Failed to save snapshot:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-2 border-border bg-card p-0">
            {/* Header */}
            <div className="border-b-2 border-border bg-muted px-4 py-1.5">
                <span className="font-mono text-xs tracking-wider text-primary uppercase">■ FILTER_CONTROLS</span>
            </div>

            <div className="flex flex-wrap items-end gap-4 p-4">
                {/* Min Time Input */}
                <div className="space-y-1">
                    <Label
                        htmlFor="minTime"
                        className="font-mono text-tiny! tracking-wide text-muted-foreground uppercase"
                    >
                        MIN_TIME_SEC
                    </Label>
                    <Input
                        id="minTime"
                        type="number"
                        value={minTime}
                        onChange={(e) => setMinTime(Number(e.target.value))}
                        className="h-9 w-24 border-2 border-border bg-input font-mono text-sm"
                        min={0}
                    />
                </div>

                {/* Refresh Interval */}
                <div className="space-y-1">
                    <Label
                        htmlFor="refresh"
                        className="font-mono text-tiny! tracking-wide text-muted-foreground uppercase"
                    >
                        REFRESH_SEC
                    </Label>
                    <Input
                        id="refresh"
                        type="number"
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="h-9 w-24 border-2 border-border bg-input font-mono text-sm"
                        min={1}
                    />
                </div>

                {/* IP Filter */}
                <div className="space-y-1">
                    <Label
                        htmlFor="ipFilter"
                        className="font-mono text-tiny! tracking-wide text-muted-foreground uppercase"
                    >
                        IP_FILTER
                    </Label>
                    <div className="flex gap-1">
                        <Input
                            type="text"
                            id="ipFilter"
                            value={ipFilter || ""}
                            placeholder="0.0.0.0"
                            className="h-9 w-40 border-2 border-border bg-input font-mono text-sm placeholder:text-muted-foreground/40"
                            onChange={(e) => setIpFilter(e.target.value || undefined)}
                        />
                        {ipFilter && (
                            <Button
                                size="icon"
                                variant="ghost"
                                title="Clear IP filter"
                                className="h-9 w-9 cursor-pointer border-2 border-border hover:border-destructive hover:bg-destructive/10 hover:text-foreground"
                                onClick={() => setIpFilter(undefined)}
                            >
                                <XIcon weight="bold" className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Show All Toggle */}
                <div className="space-y-1">
                    <Label className="font-mono text-tiny! tracking-wide text-muted-foreground uppercase">
                        OPTIONS
                    </Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={toggleShowAll}
                                    variant={showAll ? "default" : "outline"}
                                    className="h-9 cursor-pointer border-2 font-mono text-xs tracking-wide uppercase"
                                >
                                    {showAll ? "● " : "○ "}SHOW_ALL
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md border-2 border-border bg-popover p-3">
                                <p className="font-mono text-xs font-bold text-muted-foreground uppercase">
                                    SHOW_ALL_QUERIES
                                </p>
                                <p className="mt-2 font-mono text-tiny leading-relaxed text-foreground">
                                    When disabled, filters system queries, private IPs (192.*), MongoDB internal ops,
                                    monitoring tools, and health checks.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Action Buttons */}
                <div className="ml-auto flex gap-2">
                    <Button
                        onClick={resetFilters}
                        variant="outline"
                        className="h-9 cursor-pointer border-2 font-mono text-xs tracking-wide uppercase"
                        title="Reset filters to default"
                    >
                        <ArrowCounterClockwiseIcon weight="bold" className="mr-2 h-3.5 w-3.5" />
                        RESET
                    </Button>

                    <Button
                        onClick={handleSaveAll}
                        disabled={isSaving || saved}
                        variant={saved ? "default" : "outline"}
                        className="h-9 cursor-pointer border-2 font-mono text-xs tracking-wide uppercase"
                    >
                        {saved ? (
                            <>
                                <CheckIcon weight="bold" className="mr-2 h-3.5 w-3.5" />
                                SAVED
                            </>
                        ) : (
                            <>
                                <FloppyDiskIcon weight="bold" className="mr-2 h-3.5 w-3.5" />
                                SAVE_ALL
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
