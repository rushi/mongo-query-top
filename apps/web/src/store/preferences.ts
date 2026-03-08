import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { settingsHydrated, useSettings } from "./settings";

interface PreferencesState {
    serverId: string;
    minTime: number;
    refreshInterval: number;
    showAll: boolean;
    isPaused: boolean;
    ipFilter?: string;

    setServerId: (id: string) => void;
    setMinTime: (time: number) => void;
    setRefreshInterval: (interval: number) => void;
    toggleShowAll: () => void;
    togglePause: () => void;
    setIpFilter: (ip?: string) => void;
    resetFilters: () => void;
}

// Get initial defaults from settings
const getInitialState = () => {
    const { defaultFilters } = useSettings.getState();
    return {
        serverId: "localhost",
        minTime: defaultFilters.minTimeMs,
        refreshInterval: defaultFilters.refreshSec,
        showAll: defaultFilters.showAll,
        isPaused: false,
        ipFilter: undefined,
    };
};

export const usePreferences = create<PreferencesState>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                ...getInitialState(),

                setServerId: (id) => set({ serverId: id }),
                setMinTime: (time) => set({ minTime: time }),
                setRefreshInterval: (interval) => set({ refreshInterval: interval }),
                toggleShowAll: () => set((state) => ({ showAll: !state.showAll })),
                togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
                setIpFilter: (ip) => set({ ipFilter: ip }),
                resetFilters: () => {
                    const { defaultFilters } = useSettings.getState();
                    set({
                        minTime: defaultFilters.minTimeMs,
                        refreshInterval: defaultFilters.refreshSec,
                        showAll: defaultFilters.showAll,
                        isPaused: false,
                        ipFilter: undefined,
                    });
                },
            }),
            {
                name: "mongo-query-top-preferences",
                // Only persist these fields, not minTime/refreshInterval/showAll
                partialize: (state) => ({
                    serverId: state.serverId,
                    isPaused: state.isPaused,
                    ipFilter: state.ipFilter,
                }),
                onRehydrateStorage: () => {
                    return async (state, error) => {
                        if (!error && state) {
                            // Wait for settings to hydrate
                            await settingsHydrated;

                            // Now sync with settings defaults
                            const { defaultFilters } = useSettings.getState();
                            console.log("[Preferences] Syncing with settings defaults", defaultFilters);
                            usePreferences.setState({
                                minTime: defaultFilters.minTimeMs,
                                refreshInterval: defaultFilters.refreshSec,
                                showAll: defaultFilters.showAll,
                            });
                        }
                    };
                },
            },
        ),
    ),
);

// Sync preferences with settings defaults only when settings are applied (modal closes)
useSettings.subscribe(
    (state) => state.settingsVersion,
    (settingsVersion) => {
        const { defaultFilters } = useSettings.getState();
        usePreferences.setState({
            minTime: defaultFilters.minTimeMs,
            refreshInterval: defaultFilters.refreshSec,
            showAll: defaultFilters.showAll,
        });
    },
);
