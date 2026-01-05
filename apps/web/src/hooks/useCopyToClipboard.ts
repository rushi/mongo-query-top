import { useBoolean } from "ahooks";

export const useCopyToClipboard = (resetDelay = 500) => {
    const [copied, { setTrue: setCopiedTrue, setFalse: setCopiedFalse }] = useBoolean(false);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedTrue();
            setTimeout(() => setCopiedFalse(), resetDelay);
            return true;
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
            return false;
        }
    };

    return { copied, copy };
};
