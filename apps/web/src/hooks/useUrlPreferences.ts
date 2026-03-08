import { useMemoizedFn } from "ahooks";
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useSettings } from "../store/settings";

export type SortColumn = "runtime" | "operation" | "namespace" | "client" | "opid";
export type SortDirection = "asc" | "desc";

// Get defaults from settings
const getDefaults = () => {
    const { defaultFilters } = useSettings.getState();
    return {
        serverId: "localhost",
        minTime: defaultFilters.minTimeMs,
        refreshInterval: defaultFilters.refreshSec,
        showAll: defaultFilters.showAll,
        isPaused: false,
        sortBy: "runtime" as SortColumn,
        sortDirection: "desc" as SortDirection,
    };
};

// Define parsers for each URL param (no defaults, we'll apply them dynamically)
const preferenceParsers = {
    serverId: parseAsString,
    minTime: parseAsInteger,
    refreshInterval: parseAsInteger,
    showAll: parseAsBoolean,
    isPaused: parseAsBoolean,
    sortBy: parseAsString,
    sortDirection: parseAsString,
    ipFilter: parseAsString, // Optional, no default
};

export const useUrlPreferences = () => {
    const [preferences, setPreferences] = useQueryStates(preferenceParsers, {
        history: "push", // Use push to enable back/forward navigation
        shallow: false, // Allow full page navigation if needed
    });

    // Get defaults from settings
    const DEFAULTS = getDefaults();

    // Extract values with proper typing, applying defaults from settings
    const serverId = preferences.serverId ?? DEFAULTS.serverId;
    const minTime = preferences.minTime ?? DEFAULTS.minTime;
    const refreshInterval = preferences.refreshInterval ?? DEFAULTS.refreshInterval;
    const showAll = preferences.showAll ?? DEFAULTS.showAll;
    const isPaused = preferences.isPaused ?? DEFAULTS.isPaused;
    const sortBy = (preferences.sortBy as SortColumn) ?? DEFAULTS.sortBy;
    const sortDirection = (preferences.sortDirection as SortDirection) ?? DEFAULTS.sortDirection;
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
        const defaults = getDefaults();
        setPreferences({
            minTime: defaults.minTime,
            refreshInterval: defaults.refreshInterval,
            showAll: defaults.showAll,
            isPaused: defaults.isPaused,
            sortBy: defaults.sortBy,
            sortDirection: defaults.sortDirection,
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
