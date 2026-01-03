import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useCallback } from "react";

export type SortColumn = "runtime" | "operation" | "namespace" | "client" | "opid";
export type SortDirection = "asc" | "desc";

// Define default values
const DEFAULTS = {
    serverId: "localhost",
    minTime: 1,
    refreshInterval: 2,
    showAll: false,
    sortBy: "runtime" as SortColumn,
    sortDirection: "desc" as SortDirection,
};

// Define parsers for each URL param
const preferenceParsers = {
    serverId: parseAsString.withDefault(DEFAULTS.serverId),
    minTime: parseAsInteger.withDefault(DEFAULTS.minTime),
    refreshInterval: parseAsInteger.withDefault(DEFAULTS.refreshInterval),
    showAll: parseAsBoolean.withDefault(DEFAULTS.showAll),
    sortBy: parseAsString.withDefault(DEFAULTS.sortBy),
    sortDirection: parseAsString.withDefault(DEFAULTS.sortDirection),
    ipFilter: parseAsString, // Optional, no default
};

export const useUrlPreferences = () => {
    const [preferences, setPreferences] = useQueryStates(preferenceParsers, {
        history: "push", // Use push to enable back/forward navigation
        shallow: false, // Allow full page navigation if needed
    });

    // Extract values with proper typing
    const serverId = preferences.serverId;
    const minTime = preferences.minTime;
    const refreshInterval = preferences.refreshInterval;
    const showAll = preferences.showAll;
    const sortBy = preferences.sortBy as SortColumn;
    const sortDirection = preferences.sortDirection as SortDirection;
    const ipFilter = preferences.ipFilter ?? undefined;

    // Create setter functions
    const setServerId = useCallback(
        (id: string) => {
            setPreferences({ serverId: id });
        },
        [setPreferences],
    );

    const setMinTime = useCallback(
        (time: number) => {
            setPreferences({ minTime: time });
        },
        [setPreferences],
    );

    const setRefreshInterval = useCallback(
        (interval: number) => {
            setPreferences({ refreshInterval: interval });
        },
        [setPreferences],
    );

    const toggleShowAll = useCallback(() => {
        setPreferences({ showAll: !preferences.showAll });
    }, [preferences.showAll, setPreferences]);

    const setSortColumn = useCallback(
        (column: SortColumn) => {
            // If clicking the same column, toggle direction
            if (preferences.sortBy === column) {
                const newDirection = preferences.sortDirection === "desc" ? "asc" : "desc";
                setPreferences({ sortDirection: newDirection });
            } else {
                // New column - default to descending
                setPreferences({ sortBy: column, sortDirection: "desc" });
            }
        },
        [preferences.sortBy, preferences.sortDirection, setPreferences],
    );

    const setIpFilter = useCallback(
        (ip?: string) => {
            setPreferences({ ipFilter: ip || null });
        },
        [setPreferences],
    );

    const resetFilters = useCallback(() => {
        setPreferences({
            minTime: DEFAULTS.minTime,
            refreshInterval: DEFAULTS.refreshInterval,
            showAll: DEFAULTS.showAll,
            sortBy: DEFAULTS.sortBy,
            sortDirection: DEFAULTS.sortDirection,
            ipFilter: null,
        });
    }, [setPreferences]);

    return {
        serverId,
        minTime,
        refreshInterval,
        showAll,
        sortBy,
        sortDirection,
        ipFilter,
        setServerId,
        setMinTime,
        setRefreshInterval,
        toggleShowAll,
        setSortColumn,
        setIpFilter,
        resetFilters,
    };
};
