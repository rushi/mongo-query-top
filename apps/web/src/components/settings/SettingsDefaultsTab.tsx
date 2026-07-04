import type { DefaultFilters } from "../../store/settings";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface SettingsDefaultsTabProps {
    defaultFilters: DefaultFilters;
    setDefaultFilters: (filters: Partial<DefaultFilters>) => void;
}

export const SettingsDefaultsTab = ({ defaultFilters, setDefaultFilters }: SettingsDefaultsTabProps) => {
    return (
        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
            <h3 className="font-mono text-sm font-bold text-primary uppercase">▸ DEFAULT FILTER VALUES</h3>
            <p className="font-mono text-[10px] text-muted-foreground">
                These values are used when resetting filters or starting a new session
            </p>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label
                        htmlFor="defaultMinTime"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        MIN_TIME_MS (Default: 1000)
                    </Label>
                    <Input
                        type="number"
                        id="defaultMinTime"
                        value={defaultFilters.minTimeMs}
                        min={0}
                        step={100}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setDefaultFilters({ minTimeMs: Number(e.target.value) })}
                    />
                    <p className="font-mono text-[9px] text-muted-foreground">
                        Minimum query runtime in milliseconds to display
                    </p>
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="defaultRefresh"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        REFRESH_SEC (Default: 2)
                    </Label>
                    <Input
                        type="number"
                        id="defaultRefresh"
                        value={defaultFilters.refreshSec}
                        min={1}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setDefaultFilters({ refreshSec: Number(e.target.value) })}
                    />
                    <p className="font-mono text-[9px] text-muted-foreground">Query refresh interval in seconds</p>
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div>
                        <Label
                            htmlFor="defaultShowAll"
                            className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                        >
                            SHOW_ALL (Default: Off)
                        </Label>
                        <p className="font-mono text-[9px] text-muted-foreground">
                            Show all queries including system/internal operations
                        </p>
                    </div>
                    <Switch
                        id="defaultShowAll"
                        checked={defaultFilters.showAll}
                        onCheckedChange={(checked) => setDefaultFilters({ showAll: checked })}
                    />
                </div>
            </div>
        </div>
    );
};
