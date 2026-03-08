import { ArrowCounterClockwiseIcon, CheckIcon, GearIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../store/settings";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export const Settings = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAutoSaved, setShowAutoSaved] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

    const {
        defaultFilters,
        autoSave,
        issueThresholds,
        uiPreferences,
        setDefaultFilters,
        setAutoSave,
        setIssueThresholds,
        setUiPreferences,
        applySettings,
        resetToDefaults,
    } = useSettings();

    // Show auto-save indicator when settings change
    useEffect(() => {
        if (isOpen) {
            // Clear existing timeout
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Show auto-saved indicator
            setShowAutoSaved(true);

            // Hide after 2 seconds
            autoSaveTimeoutRef.current = setTimeout(() => {
                setShowAutoSaved(false);
            }, 2000);
        }
    }, [defaultFilters, autoSave, issueThresholds, uiPreferences, isOpen]);

    const handleReset = () => {
        resetToDefaults();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Apply settings when modal closes (by any means: Close button, X button, Escape, etc.)
            applySettings();
        }
        setIsOpen(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Settings" className="h-8 w-8 border-2 border-border">
                    <GearIcon weight="bold" className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl border-2 border-border bg-background">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-12">
                        <DialogTitle className="font-mono text-lg tracking-wider text-primary uppercase">
                            ⚙ SETTINGS
                        </DialogTitle>
                        {showAutoSaved && (
                            <div className="flex items-center gap-2 rounded border-2 border-primary bg-primary/10 px-3 py-1">
                                <CheckIcon weight="bold" className="h-3.5 w-3.5 text-primary" />
                                <span className="font-mono text-xs text-primary uppercase">Auto-saved</span>
                            </div>
                        )}
                    </div>
                    <DialogDescription className="font-mono text-xs text-muted-foreground">
                        Configure default values, auto-save behavior, and issue detection thresholds
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="defaults" className="mt-4">
                    <TabsList className="grid w-full grid-cols-4 border-2 border-border">
                        <TabsTrigger value="defaults" className="font-mono text-xs uppercase">
                            DEFAULTS
                        </TabsTrigger>
                        <TabsTrigger value="autosave" className="font-mono text-xs uppercase">
                            AUTO-SAVE
                        </TabsTrigger>
                        <TabsTrigger value="thresholds" className="font-mono text-xs uppercase">
                            THRESHOLDS
                        </TabsTrigger>
                        <TabsTrigger value="ui" className="font-mono text-xs uppercase">
                            UI
                        </TabsTrigger>
                    </TabsList>

                    {/* DEFAULT FILTERS TAB */}
                    <TabsContent value="defaults" className="space-y-6 pt-4">
                        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
                            <h3 className="font-mono text-sm font-bold text-primary uppercase">
                                ▸ DEFAULT FILTER VALUES
                            </h3>
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
                                    <p className="font-mono text-[9px] text-muted-foreground">
                                        Query refresh interval in seconds
                                    </p>
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
                    </TabsContent>

                    {/* AUTO-SAVE TAB */}
                    <TabsContent value="autosave" className="space-y-6 pt-4">
                        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
                            <h3 className="font-mono text-sm font-bold text-primary uppercase">
                                ▸ AUTO-SAVE CONFIGURATION
                            </h3>
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
                                        onChange={(e) =>
                                            setAutoSave({ longRunningThresholdSecs: Number(e.target.value) })
                                        }
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
                    </TabsContent>

                    {/* ISSUE THRESHOLDS TAB */}
                    <TabsContent value="thresholds" className="space-y-6 pt-4">
                        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
                            <h3 className="font-mono text-sm font-bold text-primary uppercase">
                                ▸ ISSUE DETECTION THRESHOLDS
                            </h3>
                            <p className="font-mono text-[10px] text-muted-foreground">
                                Configure when query issues should be flagged
                            </p>

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
                                        onChange={(e) =>
                                            setIssueThresholds({ longRunningWarningSecs: Number(e.target.value) })
                                        }
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
                                        onChange={(e) =>
                                            setIssueThresholds({ longRunningCriticalSecs: Number(e.target.value) })
                                        }
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
                                        onChange={(e) =>
                                            setIssueThresholds({ docsExaminedRatioWarning: Number(e.target.value) })
                                        }
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
                                        onChange={(e) =>
                                            setIssueThresholds({ largeResultSetWarning: Number(e.target.value) })
                                        }
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
                                        onChange={(e) =>
                                            setIssueThresholds({ highMemoryWarningMB: Number(e.target.value) })
                                        }
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
                                        onChange={(e) =>
                                            setIssueThresholds({ timeoutRiskSecs: Number(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* UI PREFERENCES TAB */}
                    <TabsContent value="ui" className="space-y-6 pt-4">
                        <div className="space-y-4 border-2 border-border bg-muted/30 p-4">
                            <h3 className="font-mono text-sm font-bold text-primary uppercase">▸ UI PREFERENCES</h3>
                            <p className="font-mono text-[10px] text-muted-foreground">
                                Customize the appearance and behavior of the interface
                            </p>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="tableHeight"
                                        className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                                    >
                                        TABLE HEIGHT (Pixels, Default: 600)
                                    </Label>
                                    <Input
                                        type="number"
                                        id="tableHeight"
                                        value={uiPreferences.tableHeight}
                                        min={300}
                                        max={1200}
                                        step={50}
                                        className="h-9 w-full border-2 border-border bg-input font-mono text-sm"
                                        onChange={(e) => setUiPreferences({ tableHeight: Number(e.target.value) })}
                                    />
                                    <p className="font-mono text-[9px] text-muted-foreground">
                                        Height of the query table viewport
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer with actions */}
                <div className="mt-6 flex items-center justify-between border-t-2 border-border pt-4">
                    <Button
                        variant="outline"
                        className="border-2 font-mono text-xs tracking-wide uppercase"
                        onClick={handleReset}
                    >
                        <ArrowCounterClockwiseIcon weight="bold" className="mr-2 h-3.5 w-3.5" />
                        RESET TO DEFAULTS
                    </Button>

                    <Button
                        variant="outline"
                        className="border-2 font-mono text-xs tracking-wide uppercase"
                        onClick={() => setIsOpen(false)}
                    >
                        CLOSE
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
