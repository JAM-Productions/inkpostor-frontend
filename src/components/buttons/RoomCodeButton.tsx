import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";

interface RoomCodeButtonProps {
  roomId: string;
}

export function RoomCodeButton({ roomId }: RoomCodeButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  };

  return (
    <button
      type="button"
      data-testid="topbar-room-code"
      onClick={handleCopy}
      className="group flex items-center gap-2 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-ink-surface px-3 py-2 text-white shadow-[3px_3px_0px_#0c0b09] transition-colors hover:-rotate-1 hover:bg-stone-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
      title={copied ? t("lobby.copied") : t("lobby.clickToCopy")}
      aria-label={`${t("lobby.roomCode")}: ${roomId}`}
    >
      <span className="font-short-stack text-sm font-bold tracking-[0.14em] ">
        {roomId}
      </span>
      {copied ? (
        <Check className="size-4 text-green-400" aria-hidden="true" />
      ) : (
        <Copy
          className="size-4 text-stone-400 transition-colors group-hover:text-amber-300"
          aria-hidden="true"
        />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? t("lobby.copied") : ""}
      </span>
    </button>
  );
}
