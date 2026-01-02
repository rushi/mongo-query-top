import { usePreferences } from "../store/preferences";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

export const FilterControls = () => {
    const {
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
    } = usePreferences();

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

                <Button
                    onClick={toggleShowAll}
                    variant={showAll ? "default" : "outline"}
                    className="h-9"
                >
                    Show All
                </Button>

                <Button
                    onClick={toggleReversed}
                    variant={reversed ? "default" : "outline"}
                    className="h-9"
                >
                    Reversed
                </Button>
            </div>
        </Card>
    );
};
