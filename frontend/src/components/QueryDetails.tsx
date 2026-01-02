import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import type { ProcessedQuery } from "../types";

interface QueryDetailsProps {
    query: ProcessedQuery | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const QueryDetails = ({ query, open, onOpenChange }: QueryDetailsProps) => {
    if (!query) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Query Details</DialogTitle>
                    <DialogDescription>
                        Detailed information about operation #{query.opid}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 my-4">
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Operation ID</div>
                        <div className="font-mono text-lg">{query.opid}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Runtime</div>
                        <div className="text-lg font-semibold">{query.runtime_formatted}</div>
                        <div className="text-xs text-muted-foreground">
                            ({query.secs_running} seconds)
                        </div>
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
                            <div className="text-xs text-muted-foreground">
                                Port: {query.client.port}
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">User Agent</div>
                        <div className="text-sm">{query.userAgent}</div>
                    </div>
                </div>

                {query.client.geo && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">Location</div>
                        <div className="text-sm text-muted-foreground">
                            {query.client.geo.city && `${query.client.geo.city}, `}
                            {query.client.geo.region && `${query.client.geo.region}, `}
                            {query.client.geo.country}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 mb-4">
                    {query.isCollscan && (
                        <Badge variant="destructive">COLLSCAN</Badge>
                    )}
                    {query.waitingForLock && (
                        <Badge variant="outline">🔒 Waiting for Lock</Badge>
                    )}
                    {query.planSummary && !query.isCollscan && (
                        <Badge variant="outline">{query.planSummary}</Badge>
                    )}
                </div>

                {query.isCollscan && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                        <div className="flex items-start gap-2">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h4 className="font-semibold mb-1">Collection Scan Detected</h4>
                                <p className="text-sm text-muted-foreground">
                                    This query is performing a collection scan without using an index.
                                    Consider adding an appropriate index to improve performance.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {query.message && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">Message</div>
                        <div className="text-sm text-muted-foreground font-mono">
                            {query.message}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold mb-2">Query Object</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs font-mono max-h-[300px]">
                        {JSON.stringify(query.query, null, 2)}
                    </pre>
                </div>
            </DialogContent>
        </Dialog>
    );
};
