import type { IssueThresholds } from "../../store/settings";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SettingsThresholdsTabProps {
    issueThresholds: IssueThresholds;
    setIssueThresholds: (thresholds: Partial<IssueThresholds>) => void;
}

export const SettingsThresholdsTab = ({ issueThresholds, setIssueThresholds }: SettingsThresholdsTabProps) => {
    return (
        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
            <h3 className="font-mono text-sm font-bold text-primary uppercase">▸ ISSUE DETECTION THRESHOLDS</h3>
            <p className="font-mono text-[10px] text-muted-foreground">Configure when query issues should be flagged</p>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label
                        htmlFor="longRunningWarning"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        LONG-RUNNING WARNING (Seconds, Default: 30)
                    </Label>
                    <Input
                        type="number"
                        id="longRunningWarning"
                        value={issueThresholds.longRunningWarningSecs}
                        min={1}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setIssueThresholds({ longRunningWarningSecs: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="longRunningCritical"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        LONG-RUNNING CRITICAL (Seconds, Default: 60)
                    </Label>
                    <Input
                        type="number"
                        id="longRunningCritical"
                        value={issueThresholds.longRunningCriticalSecs}
                        min={1}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setIssueThresholds({ longRunningCriticalSecs: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="docsExaminedRatio"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        DOCS EXAMINED RATIO (Default: 10)
                    </Label>
                    <Input
                        type="number"
                        id="docsExaminedRatio"
                        value={issueThresholds.docsExaminedRatioWarning}
                        min={1}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setIssueThresholds({ docsExaminedRatioWarning: Number(e.target.value) })}
                    />
                    <p className="font-mono text-[9px] text-muted-foreground">
                        Flag when examined/returned docs ratio exceeds this value
                    </p>
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="largeResultSet"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        LARGE RESULT SET (Documents, Default: 1000)
                    </Label>
                    <Input
                        type="number"
                        id="largeResultSet"
                        value={issueThresholds.largeResultSetWarning}
                        min={1}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setIssueThresholds({ largeResultSetWarning: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="highMemory"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        HIGH MEMORY WARNING (MB, Default: 100)
                    </Label>
                    <Input
                        type="number"
                        id="highMemory"
                        value={issueThresholds.highMemoryWarningMB}
                        min={1}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setIssueThresholds({ highMemoryWarningMB: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-2">
                    <Label
                        htmlFor="timeoutRisk"
                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                    >
                        TIMEOUT RISK (Seconds, Default: 300)
                    </Label>
                    <Input
                        type="number"
                        id="timeoutRisk"
                        value={issueThresholds.timeoutRiskSecs}
                        min={1}
                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                        onChange={(e) => setIssueThresholds({ timeoutRiskSecs: Number(e.target.value) })}
                    />
                </div>
            </div>
        </div>
    );
};
