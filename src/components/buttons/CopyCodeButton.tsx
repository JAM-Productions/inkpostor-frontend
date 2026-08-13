import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";

interface CopyCodeButtonProps {
  roomId: string | null;
}

export const CopyCodeButton: React.FC<CopyCodeButtonProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const hasRoomId = !!roomId;

  const handleCopy = async () => {
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy room code:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!hasRoomId}
      className={`group relative inline-flex flex-col items-center gap-2 bg-[#26221d] border-3 border-stone-950 rounded-[20px_6px_22px_7px] px-8 py-4 shadow-[5px_5px_0px_#0c0b09] transition-colors transition-transform ${
        hasRoomId
          ? "hover:border-amber-400 hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#0c0b09] cursor-pointer"
          : "cursor-not-allowed opacity-60"
      }`}
      title={hasRoomId ? t("lobby.clickToCopy") : t("lobby.waitingCode")}
    >
      <span
        data-testid="room-code-display"
        className="text-5xl font-short-stack font-bold tracking-[0.2em] text-white drop-shadow-sm"
      >
        {roomId ?? "------"}
      </span>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
        {copied ? (
          <>
            <Check className="size-3 text-green-400" />
            <span className="text-green-400">{t("lobby.copied")}</span>
          </>
        ) : (
          <>
            <Copy
              className={`size-3 ${
                hasRoomId
                  ? "text-stone-500 group-hover:text-stone-400"
                  : "text-stone-600"
              }`}
            />
            <span
              className={
                hasRoomId
                  ? "text-stone-500 group-hover:text-stone-400"
                  : "text-stone-600"
              }
            >
              {hasRoomId ? t("lobby.clickToCopy") : t("lobby.waitingCode")}
            </span>
          </>
        )}
      </div>
    </button>
  );
};
