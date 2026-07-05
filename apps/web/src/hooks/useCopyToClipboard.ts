import { useBoolean } from "ahooks";
import { log } from "evlog";

export const useCopyToClipboard = (resetDelay = 500) => {
    const [copied, { setTrue: setCopiedTrue, setFalse: setCopiedFalse }] = useBoolean(false);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedTrue();
            setTimeout(() => setCopiedFalse(), resetDelay);
            return true;
        } catch (err) {
            log.error({ action: "copy_to_clipboard", error: err instanceof Error ? err.message : String(err) });
            return false;
        }
    };

    return { copied, copy };
};
