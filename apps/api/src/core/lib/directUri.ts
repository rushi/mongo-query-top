const SCHEME = "mongodb://";

// Rewrites a replica-set connection string to talk directly to a single host,
// so per-interval `top` sampling always hits the same node (cross-node diffs are
// meaningless). Drops replicaSet and forces directConnection; keeps credentials,
// database, and auth params. Only standard mongodb:// URIs are supported —
// mongodb+srv:// can't be pinned this way, so the caller must fall back.
export const buildDirectUri = (uri: string, host: string): string => {
    if (!uri.startsWith(SCHEME)) {
        throw new Error("Node pinning requires a standard mongodb:// connection string");
    }

    const rest = uri.slice(SCHEME.length);
    const atIndex = rest.lastIndexOf("@");
    const credentials = atIndex >= 0 ? rest.slice(0, atIndex + 1) : "";
    const afterCredentials = atIndex >= 0 ? rest.slice(atIndex + 1) : rest;

    const slashIndex = afterCredentials.indexOf("/");
    const tail = slashIndex >= 0 ? afterCredentials.slice(slashIndex) : "/";
    const queryIndex = tail.indexOf("?");
    const path = queryIndex >= 0 ? tail.slice(0, queryIndex) : tail;

    const params = new URLSearchParams(queryIndex >= 0 ? tail.slice(queryIndex + 1) : "");
    params.delete("replicaSet");
    params.set("directConnection", "true");

    return `${SCHEME}${credentials}${host}${path}?${params.toString()}`;
};
