import type { AutoSaveSettings } from "../../store/settings";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface SettingsAutoSaveTabProps {
    autoSave: AutoSaveSettings;
    setAutoSave: (autoSave: Partial<AutoSaveSettings>) => void;
}

export const SettingsAutoSaveTab = ({ autoSave, setAutoSave }: SettingsAutoSaveTabProps) => {
    return (
        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
            <h3 className="font-mono text-sm font-bold text-primary uppercase">▸ AUTO-SAVE CONFIGURATION</h3>
            <p className="font-mono text-[10px] text-muted-foreground">
                Automatically save problematic queries to disk for later analysis
            </p>

            <div className="grid gap-4">
                <div className="flex items-center justify-between space-x-2">
                    <div>
                        <Label
                            htmlFor="autoSaveEnabled"
                            className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                        >
                            ENABLE AUTO-SAVE
                        </Label>
                        <p className="font-mono text-[9px] text-muted-foreground">
                            Automatically save queries matching criteria below
                        </p>
                    </div>
                    <Switch
                        id="autoSaveEnabled"
                        checked={autoSave.enabled}
                        onCheckedChange={(checked) => setAutoSave({ enabled: checked })}
                    />
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="autoSaveThreshold"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        LONG-RUNNING THRESHOLD (Seconds)
                    </Label>
                    <Input
                        type="number"
                        id="autoSaveThreshold"
                        value={autoSave.longRunningThresholdSecs}
                        min={1}
                        disabled={!autoSave.enabled}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setAutoSave({ longRunningThresholdSecs: Number(e.target.value) })}
                    />
                    <p className="font-mono text-[9px] text-muted-foreground">
                        Auto-save queries running longer than this value
                    </p>
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div>
                        <Label
                            htmlFor="autoSaveCollscan"
                            className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                        >
                            SAVE COLLSCAN QUERIES
                        </Label>
                        <p className="font-mono text-[9px] text-muted-foreground">
                            Auto-save queries performing full collection scans
                        </p>
                    </div>
                    <Switch
                        id="autoSaveCollscan"
                        checked={autoSave.saveCollscanQueries}
                        disabled={!autoSave.enabled}
                        onCheckedChange={(checked) => setAutoSave({ saveCollscanQueries: checked })}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div>
                        <Label
                            htmlFor="autoSaveTimeout"
                            className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                        >
                            SAVE TIMEOUT RISK QUERIES
                        </Label>
                        <p className="font-mono text-[9px] text-muted-foreground">
                            Auto-save queries approaching timeout threshold
                        </p>
                    </div>
                    <Switch
                        id="autoSaveTimeout"
                        checked={autoSave.saveTimeoutRiskQueries}
                        disabled={!autoSave.enabled}
                        onCheckedChange={(checked) => setAutoSave({ saveTimeoutRiskQueries: checked })}
                    />
                </div>
            </div>
        </div>
    );
};
