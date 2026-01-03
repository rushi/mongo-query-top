import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { title: "MongoDB Query Monitor" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", type: "image/png", href: "/logo.png" },
            { rel: "apple-touch-icon", href: "/logo.png" },
        ],
    }),

    component: RootComponent,
    shellComponent: RootDocument,
});

function RootComponent() {
    return (
        <NuqsAdapter>
            <Outlet />
        </NuqsAdapter>
    );
}

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    );
}
