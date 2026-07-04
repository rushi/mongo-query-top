import type { ReadPreferenceMode } from "@mongo-query-top/types";
import { useMemoizedFn } from "ahooks";
import { parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useSettings } from "../store/settings";

const READ_PREFERENCE_MODES = ["primary", "secondaryPreferred"] as const satisfies readonly ReadPreferenceMode[];

export type SortDirection = "asc" | "desc";
export type SortColumn = "runtime" | "operation" | "namespace" | "client" | "opid";

// Get defaults from settings
const getDefaults = () => {
    const { defaultFilters } = useSettings.getState();
    return {
        isPaused: false,
        serverId: "localhost",
        showAll: defaultFilters.showAll,
        sortBy: "runtime" as SortColumn,
        minTime: defaultFilters.minTimeMs,
        sortDirection: "desc" as SortDirection,
        refreshInterval: defaultFilters.refreshSec,
    };
};

// Define parsers for each URL param (no defaults, we'll apply them dynamically)
const preferenceParsers = {
    sortBy: parseAsString,
    ipFilter: parseAsString, // Optional, no default
    appFilter: parseAsString, // Optional, no default
    userFilter: parseAsString, // Optional, no default
    serverId: parseAsString,
    minTime: parseAsInteger,
    showAll: parseAsBoolean,
    isPaused: parseAsBoolean,
    sortDirection: parseAsString,
    refreshInterval: parseAsInteger,
    readPreference: parseAsStringLiteral(READ_PREFERENCE_MODES), // Optional, no default
};

export const useUrlPreferences = () => {
    const [preferences, setPreferences] = useQueryStates(preferenceParsers, {
        history: "push", // Use push to enable back/forward navigation
        shallow: false, // Allow full page navigation if needed
    });

    // Get defaults from settings
    const DEFAULTS = getDefaults();

    // Extract values with proper typing, applying defaults from settings
    const ipFilter = preferences.ipFilter ?? undefined;
    const appFilter = preferences.appFilter ?? undefined;
    const userFilter = preferences.userFilter ?? undefined;
    const showAll = preferences.showAll ?? DEFAULTS.showAll;
    const minTime = preferences.minTime ?? DEFAULTS.minTime;
    const serverId = preferences.serverId ?? DEFAULTS.serverId;
    const isPaused = preferences.isPaused ?? DEFAULTS.isPaused;
    const readPreference = preferences.readPreference ?? undefined;
    const sortBy = (preferences.sortBy as SortColumn) ?? DEFAULTS.sortBy;
    const refreshInterval = preferences.refreshInterval ?? DEFAULTS.refreshInterval;
    const sortDirection = (preferences.sortDirection as SortDirection) ?? DEFAULTS.sortDirection;

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
        setPreferences({ ipFilter: ip ?? null });
    });

    const setAppFilter = useMemoizedFn((app?: string) => {
        setPreferences({ appFilter: app ?? null });
    });

    const setUserFilter = useMemoizedFn((user?: string) => {
        setPreferences({ userFilter: user ?? null });
    });

    const setReadPreference = useMemoizedFn((pref?: ReadPreferenceMode) => {
        setPreferences({ readPreference: pref ?? null });
    });

    const resetFilters = useMemoizedFn(() => {
        const defaults = getDefaults();
        setPreferences({
            ipFilter: null,
            appFilter: null,
            userFilter: null,
            sortBy: defaults.sortBy,
            minTime: defaults.minTime,
            showAll: defaults.showAll,
            isPaused: defaults.isPaused,
            sortDirection: defaults.sortDirection,
            refreshInterval: defaults.refreshInterval,
        });
    });

    return {
        sortBy,
        showAll,
        minTime,
        ipFilter,
        appFilter,
        userFilter,
        serverId,
        isPaused,
        sortDirection,
        refreshInterval,
        readPreference,
        setMinTime,
        setServerId,
        togglePause,
        setIpFilter,
        setAppFilter,
        setUserFilter,
        resetFilters,
        toggleShowAll,
        setSortColumn,
        setReadPreference,
        setRefreshInterval,
    };
};
