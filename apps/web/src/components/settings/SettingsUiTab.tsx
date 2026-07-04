import type { UiPreferences } from "../../store/settings";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface SettingsUiTabProps {
    uiPreferences: UiPreferences;
    setUiPreferences: (preferences: Partial<UiPreferences>) => void;
}

export const SettingsUiTab = ({ uiPreferences, setUiPreferences }: SettingsUiTabProps) => {
    return (
        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
            <h3 className="font-mono text-sm font-bold text-primary uppercase">▸ UI PREFERENCES</h3>
            <p className="font-mono text-[10px] text-muted-foreground">
                Customize the appearance and behavior of the interface
            </p>

            <div className="grid gap-4">
                <div className="flex items-center justify-between space-x-2 border-2 border-destructive/40 bg-destructive/5 p-3">
                    <div>
                        <Label
                            htmlFor="killOpEnabled"
                            className="font-mono text-[10px] tracking-wide text-destructive uppercase"
                        >
                            ENABLE KILL OP (Default: Off)
                        </Label>
                        <p className="font-mono text-[9px] text-muted-foreground">
                            Show kill button in query table to execute db.killOp()
                        </p>
                    </div>
                    <Switch
                        id="killOpEnabled"
                        checked={uiPreferences.killOpEnabled}
                        onCheckedChange={(checked) => setUiPreferences({ killOpEnabled: checked })}
                    />
                </div>
            </div>
        </div>
    );
};
