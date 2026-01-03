import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useCallback } from "react";

// Define default values
const DEFAULTS = {
    serverId: "localhost",
    minTime: 1,
    refreshInterval: 2,
    showAll: false,
    reversed: false,
};

// Define parsers for each URL param
const preferenceParsers = {
    serverId: parseAsString.withDefault(DEFAULTS.serverId),
    minTime: parseAsInteger.withDefault(DEFAULTS.minTime),
    refreshInterval: parseAsInteger.withDefault(DEFAULTS.refreshInterval),
    showAll: parseAsBoolean.withDefault(DEFAULTS.showAll),
    reversed: parseAsBoolean.withDefault(DEFAULTS.reversed),
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
    const reversed = preferences.reversed;
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

    const toggleReversed = useCallback(() => {
        setPreferences({ reversed: !preferences.reversed });
    }, [preferences.reversed, setPreferences]);

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
            reversed: DEFAULTS.reversed,
            ipFilter: null,
        });
    }, [setPreferences]);

    return {
        serverId,
        minTime,
        refreshInterval,
        showAll,
        reversed,
        ipFilter,
        setServerId,
        setMinTime,
        setRefreshInterval,
        toggleShowAll,
        toggleReversed,
        setIpFilter,
        resetFilters,
    };
};
