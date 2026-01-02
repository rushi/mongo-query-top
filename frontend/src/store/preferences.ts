import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
    serverId: string;
    minTime: number;
    refreshInterval: number;
    showAll: boolean;
    reversed: boolean;
    ipFilter?: string;

    setServerId: (id: string) => void;
    setMinTime: (time: number) => void;
    setRefreshInterval: (interval: number) => void;
    toggleShowAll: () => void;
    toggleReversed: () => void;
    setIpFilter: (ip?: string) => void;
}

export const usePreferences = create<PreferencesState>()(
    persist(
        (set) => ({
            serverId: "localhost",
            minTime: 1,
            refreshInterval: 2,
            showAll: false,
            reversed: false,
            ipFilter: undefined,

            setServerId: (id) => set({ serverId: id }),
            setMinTime: (time) => set({ minTime: time }),
            setRefreshInterval: (interval) => set({ refreshInterval: interval }),
            toggleShowAll: () => set((state) => ({ showAll: !state.showAll })),
            toggleReversed: () => set((state) => ({ reversed: !state.reversed })),
            setIpFilter: (ip) => set({ ipFilter: ip }),
        }),
        {
            name: "mongo-query-top-preferences",
        }
    )
);
