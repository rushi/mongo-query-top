import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export const usePreferences = create<PreferencesState>()(
    persist(
        (set) => ({
            serverId: "localhost",
            minTime: 1,
            refreshInterval: 2,
            showAll: false,
            isPaused: false,
            ipFilter: undefined,

            setServerId: (id) => set({ serverId: id }),
            setMinTime: (time) => set({ minTime: time }),
            setRefreshInterval: (interval) => set({ refreshInterval: interval }),
            toggleShowAll: () => set((state) => ({ showAll: !state.showAll })),
            togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
            setIpFilter: (ip) => set({ ipFilter: ip }),
            resetFilters: () =>
                set({
                    minTime: 1,
                    refreshInterval: 2,
                    showAll: false,
                    isPaused: false,
                    ipFilter: undefined,
                }),
        }),
        {
            name: "mongo-query-top-preferences",
        },
    ),
);
