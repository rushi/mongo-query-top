import { useMemoizedFn } from "ahooks";
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs";

export type SortColumn = "runtime" | "operation" | "namespace" | "client" | "opid";
export type SortDirection = "asc" | "desc";

// Define default values
const DEFAULTS = {
    serverId: "localhost",
    minTime: 1000, // milliseconds (1 second)
    refreshInterval: 2,
    showAll: false,
    isPaused: false,
    sortBy: "runtime" as SortColumn,
    sortDirection: "desc" as SortDirection,
};

// Define parsers for each URL param
const preferenceParsers = {
    serverId: parseAsString.withDefault(DEFAULTS.serverId),
    minTime: parseAsInteger.withDefault(DEFAULTS.minTime),
    refreshInterval: parseAsInteger.withDefault(DEFAULTS.refreshInterval),
    showAll: parseAsBoolean.withDefault(DEFAULTS.showAll),
    isPaused: parseAsBoolean.withDefault(DEFAULTS.isPaused),
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
    const isPaused = preferences.isPaused;
    const sortBy = preferences.sortBy as SortColumn;
    const sortDirection = preferences.sortDirection as SortDirection;
    const ipFilter = preferences.ipFilter ?? undefined;

    // Create setter functions with useMemoizedFn (no dependency arrays needed)
    const setServerId = useMemoizedFn((id: string) => {
        setPreferences({ serverId: id });
    });

    const setMinTime = useMemoizedFn((time: number) => {
        setPreferences({ minTime: time });
    });

    const setRefreshInterval = useMemoizedFn((interval: number) => {
        setPreferences({ refreshInterval: interval });
    });

    const toggleShowAll = useMemoizedFn(() => {
        setPreferences({ showAll: !preferences.showAll });
    });

    const togglePause = useMemoizedFn(() => {
        setPreferences({ isPaused: !preferences.isPaused });
    });

    const setSortColumn = useMemoizedFn((column: SortColumn) => {
        // If clicking the same column, toggle direction
        if (preferences.sortBy === column) {
            const newDirection = preferences.sortDirection === "desc" ? "asc" : "desc";
            setPreferences({ sortDirection: newDirection });
        } else {
            // New column - default to descending
            setPreferences({ sortBy: column, sortDirection: "desc" });
        }
    });

    const setIpFilter = useMemoizedFn((ip?: string) => {
        setPreferences({ ipFilter: ip || null });
    });

    const resetFilters = useMemoizedFn(() => {
        setPreferences({
            minTime: DEFAULTS.minTime, // 1000ms
            refreshInterval: DEFAULTS.refreshInterval,
            showAll: DEFAULTS.showAll,
            isPaused: DEFAULTS.isPaused,
            sortBy: DEFAULTS.sortBy,
            sortDirection: DEFAULTS.sortDirection,
            ipFilter: null,
        });
    });

    return {
        serverId,
        minTime,
        refreshInterval,
        showAll,
        isPaused,
        sortBy,
        sortDirection,
        ipFilter,
        setServerId,
        setMinTime,
        setRefreshInterval,
        toggleShowAll,
        togglePause,
        setSortColumn,
        setIpFilter,
        resetFilters,
    };
};
