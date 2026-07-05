import type { ReadPreferenceMode } from "@mongo-query-top/types";
import { log } from "evlog";
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
    readPreferenceByServer: Record<string, ReadPreferenceMode>;

    setServerId: (id: string) => void;
    setMinTime: (time: number) => void;
    setRefreshInterval: (interval: number) => void;
    toggleShowAll: () => void;
    togglePause: () => void;
    setIpFilter: (ip?: string) => void;
    setReadPreference: (serverId: string, pref: ReadPreferenceMode) => void;
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
        readPreferenceByServer: {} as Record<string, ReadPreferenceMode>,
    };
};

// Shared by rehydration sync and the settings-modal-closed sync below
const applySettingsDefaults = () => {
    const { defaultFilters } = useSettings.getState();
    usePreferences.setState({
        minTime: defaultFilters.minTimeMs,
        refreshInterval: defaultFilters.refreshSec,
        showAll: defaultFilters.showAll,
    });
};

const syncWithSettingsDefaults = async (state: PreferencesState | undefined, error: unknown) => {
    if (!error && state) {
        // Wait for settings to hydrate
        await settingsHydrated;

        log.debug({ preferences: { event: "sync_with_settings_defaults" } });
        applySettingsDefaults();
    }
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
                setReadPreference: (serverId, pref) =>
                    set((state) => ({
                        readPreferenceByServer: { ...state.readPreferenceByServer, [serverId]: pref },
                    })),
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
                    readPreferenceByServer: state.readPreferenceByServer,
                }),
                onRehydrateStorage: () => syncWithSettingsDefaults,
            },
        ),
    ),
);

// Sync preferences with settings defaults only when settings are applied (modal closes)
useSettings.subscribe((state) => state.settingsVersion, applySettingsDefaults);
