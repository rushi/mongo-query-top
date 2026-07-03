# ReplicaSet Read Preference Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user pick `primary` vs `secondaryPreferred` at runtime per-server from the UI, instead of requiring two separate server config entries (one per read target) per replica set.

**Architecture:** Add a shared `ReadPreferenceMode` type (`"primary" | "secondaryPreferred"`). Backend: the 3 `currentOp`-issuing routes in `apps/api/src/routes/queries.ts` accept a `readPreference` querystring param (validated, defaults to `"primary"`) and pass it into `db.command(...)` instead of the connection's baked-in `client.readPreference`. Frontend: a new per-server map in the existing persisted Zustand `usePreferences` store remembers the choice per `serverId`; a 2-button toggle next to the server `Select` in `routes/index.tsx` switches it; `useServerSentEvents` and the snapshot call in `FilterControls.tsx` send it along.

**Tech Stack:** Fastify (API), MongoDB Node driver, React 19 + Zustand (web). No test framework exists in this repo — verification is `pnpm lint` / `pnpm build` plus manual smoke checks against a real replica set.

---

### Task 1: Shared `ReadPreferenceMode` type

**Files:**
- Modify: `packages/types/src/mongo.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **Step 1: Add the type**

In `packages/types/src/mongo.ts`, add at the end of the file:

```ts
export type ReadPreferenceMode = "primary" | "secondaryPreferred";
```

- [ ] **Step 2: Export it**

In `packages/types/src/index.ts`, change:

```ts
export type { MongoQuery, ServerConfig, UserPreferences } from "./mongo";
```

to:

```ts
export type { MongoQuery, ReadPreferenceMode, ServerConfig, UserPreferences } from "./mongo";
```

- [ ] **Step 3: Build the package**

Run: `pnpm --filter @mongo-query-top/types build`
Expected: exits 0, `packages/types/dist/mongo.d.ts` now contains `ReadPreferenceMode`.

Verify: `grep ReadPreferenceMode packages/types/dist/mongo.d.ts` prints the type line.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/mongo.ts packages/types/src/index.ts
git commit -m "feat(types): add ReadPreferenceMode type"
```

---

### Task 2: Backend read-preference parser

**Files:**
- Create: `apps/api/src/core/lib/readPreference.ts`

- [ ] **Step 1: Write the helper**

```ts
import type { ReadPreferenceMode } from "@mongo-query-top/types";

const VALID_MODES: ReadPreferenceMode[] = ["primary", "secondaryPreferred"];

// currentOp ignores the URI's readPreference and defaults to primary — the caller
// must pass this explicitly on every admin command that should honor the toggle.
export const parseReadPreference = (value: string | undefined): ReadPreferenceMode => {
    return VALID_MODES.includes(value as ReadPreferenceMode) ? (value as ReadPreferenceMode) : "primary";
};
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @mongo-query-top/api build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/core/lib/readPreference.ts
git commit -m "feat(api): add readPreference querystring parser"
```

---

### Task 3: Wire readPreference into the 3 currentOp routes

**Files:**
- Modify: `apps/api/src/routes/queries.ts:1-3` (imports)
- Modify: `apps/api/src/routes/queries.ts:122-145` (one-time fetch)
- Modify: `apps/api/src/routes/queries.ts:167-236` (SSE stream)
- Modify: `apps/api/src/routes/queries.ts:336-358` (snapshot)

- [ ] **Step 1: Import the parser**

Change:

```ts
import type { MongoQuery, ProcessedQuery } from "@mongo-query-top/types";
import type { FastifyInstance } from "fastify";
import { mockQueries } from "../data/mockQueries.js";
```

to:

```ts
import type { MongoQuery, ProcessedQuery } from "@mongo-query-top/types";
import type { FastifyInstance } from "fastify";
import { parseReadPreference } from "../core/lib/readPreference.js";
import { mockQueries } from "../data/mockQueries.js";
```

- [ ] **Step 2: One-time fetch route**

Change:

```ts
    fastify.get<{
        Params: { serverId: string };
        Querystring: { minTime?: string; showAll?: string };
    }>("/:serverId", async (request, reply) => {
        const { serverId } = request.params;
        const { minTime = "1000", showAll = "false" } = request.query;

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            // Convert milliseconds to seconds for MongoDB query
            const minTimeSeconds = Number(minTime) / 1000;
            const db = client.db("admin");
            const result = await db.command(
                {
                    currentOp: 1,
                    secs_running: { $gte: minTimeSeconds },
                },
                // currentOp ignores URI readPreference (defaults to primary) — pass it explicitly
                { readPreference: client.readPreference },
            );
```

to:

```ts
    fastify.get<{
        Params: { serverId: string };
        Querystring: { minTime?: string; showAll?: string; readPreference?: string };
    }>("/:serverId", async (request, reply) => {
        const { serverId } = request.params;
        const { minTime = "1000", showAll = "false", readPreference } = request.query;

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            // Convert milliseconds to seconds for MongoDB query
            const minTimeSeconds = Number(minTime) / 1000;
            const db = client.db("admin");
            const result = await db.command(
                {
                    currentOp: 1,
                    secs_running: { $gte: minTimeSeconds },
                },
                { readPreference: parseReadPreference(readPreference) },
            );
```

- [ ] **Step 3: SSE stream route**

Change:

```ts
    fastify.get<{
        Params: { serverId: string };
        Querystring: {
            minTime?: string;
            refreshInterval?: string;
            showAll?: string;
            autoSaveEnabled?: string;
            autoSaveLongRunningThreshold?: string;
            autoSaveCollscan?: string;
            autoSaveTimeoutRisk?: string;
            timeoutRiskThreshold?: string;
        };
    }>("/:serverId/stream", async (request, reply) => {
```

to:

```ts
    fastify.get<{
        Params: { serverId: string };
        Querystring: {
            minTime?: string;
            refreshInterval?: string;
            showAll?: string;
            autoSaveEnabled?: string;
            autoSaveLongRunningThreshold?: string;
            autoSaveCollscan?: string;
            autoSaveTimeoutRisk?: string;
            timeoutRiskThreshold?: string;
            readPreference?: string;
        };
    }>("/:serverId/stream", async (request, reply) => {
```

Then change:

```ts
        const { serverId } = request.params;
        const {
            minTime = "1000",
            refreshInterval = "2",
            showAll = "false",
            autoSaveEnabled = "false",
            autoSaveLongRunningThreshold = "60",
            autoSaveCollscan = "true",
            autoSaveTimeoutRisk = "true",
            timeoutRiskThreshold = "300",
        } = request.query;
```

to:

```ts
        const { serverId } = request.params;
        const {
            minTime = "1000",
            refreshInterval = "2",
            showAll = "false",
            autoSaveEnabled = "false",
            autoSaveLongRunningThreshold = "60",
            autoSaveCollscan = "true",
            autoSaveTimeoutRisk = "true",
            timeoutRiskThreshold = "300",
            readPreference,
        } = request.query;
```

Then change:

```ts
                const result = await db.command(
                    {
                        currentOp: 1,
                        secs_running: { $gte: minTimeSeconds },
                    }, // currentOp ignores URI readPreference (defaults to primary) — pass it explicitly
                    { readPreference: client.readPreference },
                );
```

to:

```ts
                const result = await db.command(
                    {
                        currentOp: 1,
                        secs_running: { $gte: minTimeSeconds },
                    },
                    { readPreference: parseReadPreference(readPreference) },
                );
```

- [ ] **Step 4: Snapshot route**

Change:

```ts
    fastify.post<{
        Params: { serverId: string };
        Querystring: { minTime?: string };
    }>("/:serverId/snapshot", async (request, reply) => {
        const { serverId } = request.params;
        const { minTime = "1000" } = request.query;

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            // Convert milliseconds to seconds for MongoDB query
            const minTimeSeconds = Number(minTime) / 1000;
            const db = client.db("admin");
            const result = await db.command(
                {
                    currentOp: 1,
                    secs_running: { $gte: minTimeSeconds },
                }, // currentOp ignores URI readPreference (defaults to primary) — pass it explicitly
                { readPreference: client.readPreference },
            );
```

to:

```ts
    fastify.post<{
        Params: { serverId: string };
        Querystring: { minTime?: string; readPreference?: string };
    }>("/:serverId/snapshot", async (request, reply) => {
        const { serverId } = request.params;
        const { minTime = "1000", readPreference } = request.query;

        const client = request.services.mongoService.getConnection(serverId);
        if (!client) {
            return reply.code(404).send({ error: "Server not connected" });
        }

        try {
            // Convert milliseconds to seconds for MongoDB query
            const minTimeSeconds = Number(minTime) / 1000;
            const db = client.db("admin");
            const result = await db.command(
                {
                    currentOp: 1,
                    secs_running: { $gte: minTimeSeconds },
                },
                { readPreference: parseReadPreference(readPreference) },
            );
```

- [ ] **Step 5: Build and lint**

Run: `pnpm --filter @mongo-query-top/api build && cd apps/api && npx eslint "src/**/*.ts" --config ../../eslint.config.js && cd ../..`
Expected: both exit 0, no `client.readPreference` references remain.

Verify: `rg -n "client.readPreference" apps/api/src/routes/queries.ts` prints nothing.

- [ ] **Step 6: Manual smoke test**

Run: `pnpm run dev:api`
Then in another terminal, with a real server configured in `config/local.yaml`:
```bash
curl -s "http://localhost:9001/api/servers/<your-server-id>/connect" -X POST -H "X-API-Key: dev-key-change-in-production"
curl -s "http://localhost:9001/api/queries/<your-server-id>?readPreference=secondaryPreferred" -H "X-API-Key: dev-key-change-in-production" | head -c 300
curl -s "http://localhost:9001/api/queries/<your-server-id>?readPreference=bogus" -H "X-API-Key: dev-key-change-in-production" | head -c 300
```
Expected: both requests succeed (200, JSON with `queries`); the `bogus` value doesn't error — falls back to primary.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/routes/queries.ts
git commit -m "feat(api): accept readPreference querystring on currentOp routes"
```

---

### Task 4: Frontend — per-server read preference in the preferences store

**Files:**
- Modify: `apps/web/src/store/preferences.ts`

- [ ] **Step 1: Add state and actions**

Change:

```ts
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
```

to:

```ts
import type { ReadPreferenceMode } from "@mongo-query-top/types";
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
```

- [ ] **Step 2: Initialize it**

Change:

```ts
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
```

to:

```ts
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
```

- [ ] **Step 3: Add the setter and persist it**

Change:

```ts
                setServerId: (id) => set({ serverId: id }),
                setMinTime: (time) => set({ minTime: time }),
                setRefreshInterval: (interval) => set({ refreshInterval: interval }),
                toggleShowAll: () => set((state) => ({ showAll: !state.showAll })),
                togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
                setIpFilter: (ip) => set({ ipFilter: ip }),
```

to:

```ts
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
```

Change:

```ts
            {
                name: "mongo-query-top-preferences",
                // Only persist these fields, not minTime/refreshInterval/showAll
                partialize: (state) => ({
                    serverId: state.serverId,
                    isPaused: state.isPaused,
                    ipFilter: state.ipFilter,
                }),
                onRehydrateStorage: () => syncWithSettingsDefaults,
            },
```

to:

```ts
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
```

- [ ] **Step 4: Type-check**

Run: `pnpm --filter @mongo-query-top/web build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/store/preferences.ts
git commit -m "feat(web): add per-server readPreference to preferences store"
```

---

### Task 5: Frontend — thread readPreference through the SSE hook

**Files:**
- Modify: `apps/web/src/hooks/useServerSentEvents.ts`

- [ ] **Step 1: Add the parameter**

Change:

```ts
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { QueryData } from "@mongo-query-top/types";
import { useDocumentVisibility, useInterval } from "ahooks";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../store/settings";
import { API_BASE, API_KEY } from "../utils/api";

const MAX_RETRY_DELAY = 30000; // 30 seconds max
const INITIAL_RETRY_DELAY = 500; // Start with 0.5 second

export const useServerSentEvents = (
    serverId: string,
    minTime: number,
    refreshInterval: number,
    showAll: boolean,
    enabled = true,
    isPaused = false,
) => {
```

to:

```ts
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { QueryData, ReadPreferenceMode } from "@mongo-query-top/types";
import { useDocumentVisibility, useInterval } from "ahooks";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../store/settings";
import { API_BASE, API_KEY } from "../utils/api";

const MAX_RETRY_DELAY = 30000; // 30 seconds max
const INITIAL_RETRY_DELAY = 500; // Start with 0.5 second

export const useServerSentEvents = (
    serverId: string,
    minTime: number,
    refreshInterval: number,
    showAll: boolean,
    readPreference: ReadPreferenceMode,
    enabled = true,
    isPaused = false,
) => {
```

- [ ] **Step 2: Append it to the SSE URL**

Change:

```ts
            // Build URL with query params
            const params = new URLSearchParams({
                minTime: String(minTime),
                refreshInterval: String(refreshInterval),
                showAll: String(showAll),
            });
```

to:

```ts
            // Build URL with query params
            const params = new URLSearchParams({
                minTime: String(minTime),
                refreshInterval: String(refreshInterval),
                showAll: String(showAll),
                readPreference,
            });
```

- [ ] **Step 3: Reconnect when it changes**

Change:

```ts
    }, [serverId, minTime, refreshInterval, showAll, enabled, isPaused, settingsVersion]);
```

to:

```ts
    }, [serverId, minTime, refreshInterval, showAll, readPreference, enabled, isPaused, settingsVersion]);
```

- [ ] **Step 4: Type-check**

Run: `pnpm --filter @mongo-query-top/web build`
Expected: fails — `routes/index.tsx` still calls `useServerSentEvents` with the old positional args. This is expected; Task 6 fixes the call site.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useServerSentEvents.ts
git commit -m "feat(web): add readPreference param to useServerSentEvents"
```

---

### Task 6: Frontend — toggle UI and wiring in the dashboard

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

- [ ] **Step 1: Import `usePreferences` and `Button`**

Change:

```ts
import { FilterControls } from "../components/FilterControls";
import { QueryDetails } from "../components/QueryDetails";
import { QueryTable } from "../components/QueryTable";
import { Settings } from "../components/Settings";
import { SummaryStats } from "../components/SummaryStats";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useFetchServers } from "../hooks/useFetchServers";
import { useServerSentEvents } from "../hooks/useServerSentEvents";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { apiClient, getApiBaseUrl } from "../utils/api";
```

to:

```ts
import { FilterControls } from "../components/FilterControls";
import { QueryDetails } from "../components/QueryDetails";
import { QueryTable } from "../components/QueryTable";
import { Settings } from "../components/Settings";
import { SummaryStats } from "../components/SummaryStats";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useFetchServers } from "../hooks/useFetchServers";
import { useServerSentEvents } from "../hooks/useServerSentEvents";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { usePreferences } from "../store/preferences";
import { apiClient, getApiBaseUrl } from "../utils/api";
```

- [ ] **Step 2: Read/derive the current server's readPreference and pass it to the SSE hook**

Change:

```ts
    const { servers, loading: serversLoading } = useFetchServers();
    const { serverId, setServerId, minTime, refreshInterval, showAll, isPaused, ipFilter } = useUrlPreferences();

    const [connectionState, setConnectionState] = useSetState({
        isConnecting: false,
        mongoConnected: false,
        connectError: null as string | null,
    });

    const { data, error, isConnected, isReconnecting, isStale } = useServerSentEvents(
        serverId,
        minTime,
        refreshInterval,
        showAll,
        connectionState.mongoConnected,
        isPaused,
    );
```

to:

```ts
    const { servers, loading: serversLoading } = useFetchServers();
    const { serverId, setServerId, minTime, refreshInterval, showAll, isPaused, ipFilter } = useUrlPreferences();
    const readPreferenceByServer = usePreferences((state) => state.readPreferenceByServer);
    const setReadPreference = usePreferences((state) => state.setReadPreference);
    const readPreference = readPreferenceByServer[serverId] ?? "primary";

    const [connectionState, setConnectionState] = useSetState({
        isConnecting: false,
        mongoConnected: false,
        connectError: null as string | null,
    });

    const { data, error, isConnected, isReconnecting, isStale } = useServerSentEvents(
        serverId,
        minTime,
        refreshInterval,
        showAll,
        readPreference,
        connectionState.mongoConnected,
        isPaused,
    );
```

- [ ] **Step 3: Add the toggle UI next to the server Select**

Change:

```tsx
                                <span className="text-muted-foreground">SRV:</span>
                                <Select value={serverId} disabled={serversLoading} onValueChange={handleServerChange}>
                                    <SelectTrigger className="h-8 w-50 border-2 border-border bg-input font-mono text-xs">
                                        <SelectValue placeholder="Select a server">
                                            {currentServer?.name ?? serverId}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="border-2 border-border">
                                        {servers.map((server) => (
                                            <SelectItem key={server.id} value={server.id} className="font-mono text-xs">
                                                {server.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Settings />
```

to:

```tsx
                                <span className="text-muted-foreground">SRV:</span>
                                <Select value={serverId} disabled={serversLoading} onValueChange={handleServerChange}>
                                    <SelectTrigger className="h-8 w-50 border-2 border-border bg-input font-mono text-xs">
                                        <SelectValue placeholder="Select a server">
                                            {currentServer?.name ?? serverId}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="border-2 border-border">
                                        {servers.map((server) => (
                                            <SelectItem key={server.id} value={server.id} className="font-mono text-xs">
                                                {server.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="ml-2 text-muted-foreground">READ:</span>
                                <Button
                                    variant={readPreference === "primary" ? "default" : "outline"}
                                    className="h-8 cursor-pointer border-2 font-mono text-xs tracking-wide uppercase"
                                    onClick={() => setReadPreference(serverId, "primary")}
                                >
                                    Primary
                                </Button>
                                <Button
                                    variant={readPreference === "secondaryPreferred" ? "default" : "outline"}
                                    className="h-8 cursor-pointer border-2 font-mono text-xs tracking-wide uppercase"
                                    onClick={() => setReadPreference(serverId, "secondaryPreferred")}
                                >
                                    Secondary
                                </Button>
                                <Settings />
```

- [ ] **Step 4: Build and lint**

Run: `pnpm --filter @mongo-query-top/web build && cd apps/web && npx eslint "src/**/*.tsx" "src/**/*.ts" --config ../../eslint.config.js && cd ../..`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat(web): add primary/secondary read preference toggle to dashboard"
```

---

### Task 7: Frontend — send readPreference on manual snapshot

**Files:**
- Modify: `apps/web/src/components/FilterControls.tsx`

- [ ] **Step 1: Read the current server's readPreference**

Change:

```tsx
import { useState } from "react";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { apiClient } from "../utils/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export const FilterControls = () => {
    const {
        serverId,
        minTime,
        refreshInterval,
        showAll,
        isPaused,
        ipFilter,
        setMinTime,
        setRefreshInterval,
        toggleShowAll,
        togglePause,
        setIpFilter,
        resetFilters,
    } = useUrlPreferences();
```

to:

```tsx
import { useState } from "react";
import { useUrlPreferences } from "../hooks/useUrlPreferences";
import { usePreferences } from "../store/preferences";
import { apiClient } from "../utils/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export const FilterControls = () => {
    const {
        serverId,
        minTime,
        refreshInterval,
        showAll,
        isPaused,
        ipFilter,
        setMinTime,
        setRefreshInterval,
        toggleShowAll,
        togglePause,
        setIpFilter,
        resetFilters,
    } = useUrlPreferences();
    const readPreference = usePreferences((state) => state.readPreferenceByServer[serverId] ?? "primary");
```

- [ ] **Step 2: Append it to the snapshot call**

Change:

```ts
            await apiClient.post(`/queries/${serverId}/snapshot?minTime=${minTime}`);
```

to:

```ts
            await apiClient.post(`/queries/${serverId}/snapshot?minTime=${minTime}&readPreference=${readPreference}`);
```

- [ ] **Step 3: Build and lint**

Run: `pnpm --filter @mongo-query-top/web build && cd apps/web && npx eslint "src/**/*.tsx" --config ../../eslint.config.js && cd ../..`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/FilterControls.tsx
git commit -m "feat(web): send readPreference on manual snapshot save"
```

---

### Task 8: Documentation

**Files:**
- Modify: `apps/api/CLAUDE.md`
- Modify: `config/local.yaml.example`

- [ ] **Step 1: Update "Adding Server Config" section**

In `apps/api/CLAUDE.md`, change:

```md
## Adding Server Config

In `config/local.yaml`:

```yaml
servers:
    my-server:
        name: My Production Server
        uri: mongodb://user:pass@host:27017/db?authSource=admin
```
```

to:

```md
## Adding Server Config

One entry per replica set — don't create separate primary/secondary entries. The dashboard has a Primary/Secondary toggle that sets `readPreference` per-request on `currentOp` calls; leave `readPreference` out of the URI (it's ignored for currentOp and overridden anyway).

In `config/local.yaml`:

```yaml
servers:
    my-server:
        name: My Production Server
        uri: mongodb://user:pass@host:27017,host2:27017/db?replicaSet=my-rs&authSource=admin
```
```

- [ ] **Step 2: Check and update `config/local.yaml.example`**

Run: `cat config/local.yaml.example`

If it contains separate primary/secondary example entries or a `readPreference` param in an example URI, edit it to show a single entry per replica set with no `readPreference` param, matching the pattern from Step 1.

- [ ] **Step 3: Commit**

```bash
git add apps/api/CLAUDE.md config/local.yaml.example
git commit -m "docs: document single-entry replicaSet config with readPreference toggle"
```

---

### Task 9: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full lint**

Run: `pnpm lint`
Expected: exits 0 across all packages.

- [ ] **Step 2: Full build**

Run: `pnpm build`
Expected: exits 0 across all packages.

- [ ] **Step 3: Format check**

Run: `pnpm format`
Expected: no diffs left uncommitted (or commit formatting fixes if any).

- [ ] **Step 4: Manual end-to-end check**

Run: `pnpm run dev:web`
In the browser: select a real replica-set server, confirm it connects, click "Secondary" — confirm the SSE connection re-establishes (check Network tab / console logs show a new `/stream?...readPreference=secondaryPreferred` request) and query data keeps flowing. Click "Primary" — confirm it reconnects again with `readPreference=primary`. Reload the page — confirm the last-selected mode for that server is remembered.

- [ ] **Step 5: Commit any final fixups**

```bash
git add -A
git commit -m "chore: fixups from full verification pass"
```
(Skip this step if there's nothing to commit.)
