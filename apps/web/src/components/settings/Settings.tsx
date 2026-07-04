import { ArrowCounterClockwiseIcon, CheckIcon, GearIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../../store/settings";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SettingsAutoSaveTab } from "./SettingsAutoSaveTab";
import { SettingsDefaultsTab } from "./SettingsDefaultsTab";
import { SettingsThresholdsTab } from "./SettingsThresholdsTab";
import { SettingsUiTab } from "./SettingsUiTab";

export const Settings = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAutoSaved, setShowAutoSaved] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

    useEffect(() => {
        if (isOpen) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            setShowAutoSaved(true);

            autoSaveTimeoutRef.current = setTimeout(() => {
                setShowAutoSaved(false);
            }, 2000);
        }
    }, [defaultFilters, autoSave, issueThresholds, uiPreferences, isOpen]);

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

                    <TabsContent value="defaults" className="space-y-6 pt-4">
                        <SettingsDefaultsTab defaultFilters={defaultFilters} setDefaultFilters={setDefaultFilters} />
                    </TabsContent>

                    <TabsContent value="autosave" className="space-y-6 pt-4">
                        <SettingsAutoSaveTab autoSave={autoSave} setAutoSave={setAutoSave} />
                    </TabsContent>

                    <TabsContent value="thresholds" className="space-y-6 pt-4">
                        <SettingsThresholdsTab
                            issueThresholds={issueThresholds}
                            setIssueThresholds={setIssueThresholds}
                        />
                    </TabsContent>

                    <TabsContent value="ui" className="space-y-6 pt-4">
                        <SettingsUiTab uiPreferences={uiPreferences} setUiPreferences={setUiPreferences} />
                    </TabsContent>
                </Tabs>

                <div className="mt-6 flex items-center justify-between border-t-2 border-border pt-4">
                    <Button
                        variant="outline"
                        className="border-2 font-mono text-xs tracking-wide uppercase"
                        onClick={resetToDefaults}
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
