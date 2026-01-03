import { createRootRoute, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    return (
        <NuqsAdapter>
            <Outlet />
        </NuqsAdapter>
    );
}
