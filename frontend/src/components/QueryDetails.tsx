import { Check, Save } from "lucide-react";
import { useState } from "react";
import { usePreferences } from "../store/preferences";
import type { ProcessedQuery } from "../types";
import { apiClient } from "../utils/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

interface QueryDetailsProps {
    query: ProcessedQuery | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const QueryDetails = ({ query, open, onOpenChange }: QueryDetailsProps) => {
    const { serverId } = usePreferences();
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    if (!query) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.post(`/api/queries/${serverId}/save`, { query });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Failed to save query:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[800px] sm:max-w-[800px] overflow-auto">
                <SheetHeader>
                    <SheetTitle>Query Details</SheetTitle>
                    <SheetDescription>Detailed information about operation #{query.opid}</SheetDescription>
                </SheetHeader>

                <div className="px-6 space-y-4">
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || saved}
                            size="sm"
                            variant={saved ? "default" : "outline"}
                        >
                            {saved ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Operation ID</div>
                            <div className="font-mono text-lg">{query.opid}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Runtime</div>
                            <div className="text-lg font-semibold">{query.runtime_formatted}</div>
                            <div className="text-xs text-muted-foreground">({query.secs_running} seconds)</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Operation</div>
                            <div className="font-medium">{query.operation}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Namespace</div>
                            <div className="font-mono text-sm">
                                <span className="text-muted-foreground">{query.database}.</span>
                                <span className="font-semibold">{query.collection}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Client IP</div>
                            <div className="font-mono">{query.client.ip}</div>
                            {query.client.port && (
                                <div className="text-xs text-muted-foreground">Port: {query.client.port}</div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">User Agent</div>
                            <div className="text-sm">{query.userAgent}</div>
                        </div>
                    </div>

                    {query.client.geo && (
                        <div className="p-3 bg-muted rounded-md">
                            <div className="text-sm font-medium mb-1">Location</div>
                            <div className="text-sm text-muted-foreground">
                                {query.client.geo.city && `${query.client.geo.city}, `}
                                {query.client.geo.region && `${query.client.geo.region}, `}
                                {query.client.geo.country}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {query.isCollscan && <Badge variant="destructive">COLLSCAN</Badge>}
                        {query.waitingForLock && <Badge variant="outline">🔒 Waiting for Lock</Badge>}
                        {query.planSummary && !query.isCollscan && <Badge variant="outline">{query.planSummary}</Badge>}
                    </div>

                    {query.isCollscan && (
                        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                            <div className="flex items-start gap-2">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <h4 className="font-semibold mb-1">Collection Scan Detected</h4>
                                    <p className="text-sm text-muted-foreground">
                                        This query is performing a collection scan without using an index. Consider
                                        adding an appropriate index to improve performance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {query.message && (
                        <div className="p-3 bg-muted rounded-md">
                            <div className="text-sm font-medium mb-1">Message</div>
                            <div className="text-sm text-muted-foreground font-mono">{query.message}</div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Query Object</h3>
                        <pre className="bg-muted p-4 rounded-md overflow-auto text-xs font-mono max-h-[300px]">
                            {JSON.stringify(query.query, null, 2)}
                        </pre>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
