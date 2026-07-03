import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

export const Route = createRootRoute({
    component: RootComponent,
});

const NAV_LINKS = [
    { to: "/", label: "QUERY_MONITOR" },
    { to: "/clients", label: "CONNECTED_CLIENTS" },
] as const;

function RootComponent() {
    return (
        <NuqsAdapter>
            <nav className="flex items-center gap-1 border-b-2 border-border bg-card px-6 py-2 font-mono text-xs">
                <span className="mr-3 tracking-wider text-muted-foreground uppercase">▸ MONGO_TOP</span>
                {NAV_LINKS.map(({ to, label }) => (
                    <Link
                        key={to}
                        to={to}
                        search={(prev) => prev}
                        className="border-2 border-transparent px-3 py-1 tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                        activeProps={{ className: "border-primary bg-primary/10 text-primary" }}
                        activeOptions={{ exact: true }}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
            <Outlet />
        </NuqsAdapter>
    );
}
