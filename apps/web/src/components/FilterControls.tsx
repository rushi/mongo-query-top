import { ArrowCounterClockwise, Check, FloppyDisk } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { usePreferences } from "../store/preferences";
import { apiClient } from "../utils/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export const FilterControls = () => {
    const {
        serverId,
        minTime,
        refreshInterval,
        showAll,
        reversed,
        ipFilter,
        setMinTime,
        setRefreshInterval,
        toggleShowAll,
        toggleReversed,
        setIpFilter,
        resetFilters,
    } = usePreferences();

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
            <div className="flex gap-4 items-end flex-wrap">
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

                <Button onClick={toggleShowAll} variant={showAll ? "default" : "outline"} className="h-9">
                    Show All
                </Button>

                <Button onClick={toggleReversed} variant={reversed ? "default" : "outline"} className="h-9">
                    Reversed
                </Button>

                <div className="ml-auto flex gap-2">
                    <Button onClick={resetFilters} variant="outline" className="h-9" title="Reset filters to default">
                        <ArrowCounterClockwise weight="bold" className="h-4 w-4 mr-2" />
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
                                <Check weight="bold" className="h-4 w-4 mr-2" />
                                Saved
                            </>
                        ) : (
                            <>
                                <FloppyDisk weight="bold" className="h-4 w-4 mr-2" />
                                Save All
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
