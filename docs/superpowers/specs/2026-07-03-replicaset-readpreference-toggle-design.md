# ReplicaSet Read Preference Toggle — Design

## Problem

Config currently requires two separate server entries per replica set to get primary vs. secondary reads (e.g. `sandbox` / `sandbox_secondary`), each with a different `readPreference` baked into the URI. This is redundant — it's the same replica set, same connection, just a different read target. Users should configure one server entry per replica set and switch primary/secondaryPreferred at runtime from the UI.

## Current State

- `ServerConfig` (`packages/types/src/mongo.ts`) is already just `{ name, uri }` — no schema change needed.
- `MongoConnectionService` connects one `MongoClient` per `serverId`, reused for the life of the process.
- `apps/api/src/routes/queries.ts` has 3 places that run `db.command({ currentOp: ... }, { readPreference: client.readPreference })` — `client.readPreference` comes from whatever `readPreference` param is baked into that server's URI. This override exists because `currentOp` ignores the URI's readPreference by default (defaults to primary).
- Frontend: `apps/web/src/store/preferences.ts` (zustand, persisted) holds `serverId` and other prefs; `apps/web/src/hooks/useUrlPreferences.ts` (nuqs) is the actual source consumed by `routes/index.tsx` for `serverId`/`minTime`/etc.

## Design

### Config

No type or schema change. Document (README/CLAUDE.md) that one server entry = one replica set, URI should omit `readPreference` (harmless if present — always overridden per-request now, but should be removed for clarity). Existing `local.yaml` primary/secondary pairs (sandbox, preprod, m01) get manually collapsed into single entries.

### Backend (`apps/api/src/routes/queries.ts`)

Add `readPreference?: "primary" | "secondaryPreferred"` to the `Querystring` type on:
- `GET /:serverId` (one-time fetch)
- `GET /:serverId/stream` (SSE)
- `POST /:serverId/snapshot`

Validate: if the value isn't exactly `"primary"` or `"secondaryPreferred"`, fall back to `"primary"`. Replace `{ readPreference: client.readPreference }` with `{ readPreference: requestedReadPreference }` in all 3 `db.command(...)` calls in this file. `POST /:serverId/kill/:opid` is untouched — `killOp` always needs primary.

### Frontend state (`apps/web/src/store/preferences.ts`)

Add to `PreferencesState`:
```ts
readPreferenceByServer: Record<string, "primary" | "secondaryPreferred">;
setReadPreference: (serverId: string, pref: "primary" | "secondaryPreferred") => void;
```
- `setReadPreference` merges into the map: `set((state) => ({ readPreferenceByServer: { ...state.readPreferenceByServer, [serverId]: pref } }))`.
- Add `readPreferenceByServer` to the persisted `partialize` fields (alongside `serverId`, `isPaused`, `ipFilter`).
- Derived read: `readPreferenceByServer[serverId] ?? "primary"` — computed where consumed (`routes/index.tsx`), not stored as a separate field.

### Frontend UI (`apps/web/src/routes/index.tsx`)

Two `Button`s next to the server `Select`, styled like the existing `SHOW_ALL` toggle in `FilterControls.tsx` (`variant={active ? "default" : "outline"}`):
```
READ: [ PRIMARY ] [ secondary ]
```
Clicking calls `setReadPreference(serverId, "primary")` / `setReadPreference(serverId, "secondaryPreferred")`.

### Wiring

- `useServerSentEvents` (`apps/web/src/hooks/useServerSentEvents.ts`) gets a new `readPreference` param, appended to the SSE URL querystring, and added to its effect dependency array (reconnects on change).
- One-time fetch / snapshot calls in `apps/web/src/utils/api.ts` call sites get `readPreference` appended as a query param, sourced the same way.

## Out of Scope

- No change to `killOp` behavior.
- No change to `ServerConfig` type or the `config` package schema.
- Not migrating the user's `local.yaml` server list automatically as part of code changes — will be a manual/assisted edit, since it's gitignored and holds live credentials.
- Not reconciling the existing `usePreferences` (zustand) vs `useUrlPreferences` (nuqs) duplication for `serverId` — pre-existing pattern, out of scope for this feature.
