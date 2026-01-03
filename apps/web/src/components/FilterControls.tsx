import { ArrowCounterClockwise, Check, FloppyDisk } from "@phosphor-icons/react/dist/ssr";
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
        <Card className="p-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                    <Label htmlFor="minTime">Min Time (s)</Label>
                    <Input
                        id="minTime"
                        type="number"
                        value={minTime}
                        onChange={(e) => setMinTime(Number(e.target.value))}
                        className="w-24"
                        min={0}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="refresh">Refresh (s)</Label>
                    <Input
                        id="refresh"
                        type="number"
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="w-24"
                        min={1}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="ipFilter">IP Filter</Label>
                    <Input
                        id="ipFilter"
                        type="text"
                        value={ipFilter || ""}
                        onChange={(e) => setIpFilter(e.target.value || undefined)}
                        placeholder="192.168.1.1"
                        className="w-40"
                    />
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={toggleShowAll} variant={showAll ? "default" : "outline"} className="h-9">
                                Show All
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                            <p className="font-semibold">Show All Queries</p>
                            <p className="mt-1 text-xs">
                                When disabled, filters out system queries, private IPs (192.*), MongoDB internal
                                operations, monitoring tools, and health checks.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="ml-auto flex gap-2">
                    <Button onClick={resetFilters} variant="outline" className="h-9" title="Reset filters to default">
                        <ArrowCounterClockwise weight="bold" className="mr-2 h-4 w-4" />
                        Reset
                    </Button>

                    <Button
                        onClick={handleSaveAll}
                        disabled={isSaving || saved}
                        variant={saved ? "default" : "outline"}
                        className="h-9"
                    >
                        {saved ? (
                            <>
                                <Check weight="bold" className="mr-2 h-4 w-4" />
                                Saved
                            </>
                        ) : (
                            <>
                                <FloppyDisk weight="bold" className="mr-2 h-4 w-4" />
                                Save All
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
