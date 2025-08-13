import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "MongoDB Query Top",
    description: "Monitor MongoDB operations in real-time",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
