import type { SortColumn, SortDirection } from "../../hooks/useUrlPreferences";
import { SortableColumnHeader } from "../shared/SortableColumnHeader";

interface QueryTableHeaderProps {
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    onSortChange: (column: SortColumn) => void;
}

export const QueryTableHeader = ({ sortColumn, sortDirection, onSortChange }: QueryTableHeaderProps) => {
    return (
        <>
            <div className="flex shrink-0 items-center border-b-2 border-border bg-muted px-4 py-2.5">
                <span className="font-mono text-xs tracking-wider text-primary uppercase">■ ACTIVE_QUERIES</span>
            </div>

            <div className="shrink-0 border-b-2 bg-card px-4 py-3">
                <div className="grid grid-cols-[40px_80px_100px_120px_minmax(200px,1fr)_140px_150px_110px] gap-4 font-mono text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                    <div>#</div>
                    <SortableColumnHeader
                        label="OP_ID"
                        isSorted={sortColumn === "opid"}
                        sortDirection={sortDirection}
                        onClick={() => onSortChange("opid")}
                    />
                    <SortableColumnHeader
                        label="RUNTIME"
                        isSorted={sortColumn === "runtime"}
                        sortDirection={sortDirection}
                        align="end"
                        className="pr-2"
                        onClick={() => onSortChange("runtime")}
                    />
                    <SortableColumnHeader
                        label="OPERATION"
                        isSorted={sortColumn === "operation"}
                        sortDirection={sortDirection}
                        onClick={() => onSortChange("operation")}
                    />
                    <SortableColumnHeader
                        label="NAMESPACE"
                        isSorted={sortColumn === "namespace"}
                        sortDirection={sortDirection}
                        onClick={() => onSortChange("namespace")}
                    />
                    <div>IP_ADDRESS</div>
                    <SortableColumnHeader
                        label="CLIENT"
                        isSorted={sortColumn === "client"}
                        sortDirection={sortDirection}
                        onClick={() => onSortChange("client")}
                    />
                    <div className="flex justify-end">ACTIONS</div>
                </div>
            </div>
        </>
    );
};
