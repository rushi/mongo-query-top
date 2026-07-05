import { useBoolean, useUnmount } from "ahooks";
import { log } from "evlog";
import { useRef } from "react";

export const useCopyToClipboard = (resetDelay = 500) => {
    const [copied, { setTrue: setCopiedTrue, setFalse: setCopiedFalse }] = useBoolean(false);
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useUnmount(() => clearTimeout(resetTimerRef.current));

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedTrue();
            // Clear any pending reset so rapid repeat copies don't flip `copied` false early.
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = setTimeout(() => setCopiedFalse(), resetDelay);
            return true;
        } catch (err) {
            log.error({ action: "copy_to_clipboard", error: err instanceof Error ? err.message : String(err) });
            return false;
        }
    };

    return { copied, copy };
};
