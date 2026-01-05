import { useState } from "react";

export const useCopyToClipboard = (resetDelay = 500) => {
    const [copied, setCopied] = useState(false);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), resetDelay);
            return true;
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
            return false;
        }
    };

    return { copied, copy };
};
