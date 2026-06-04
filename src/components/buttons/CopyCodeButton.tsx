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
      className={`group relative inline-flex flex-col items-center gap-2 bg-stone-800 border border-stone-700 rounded-2xl px-8 py-4 shadow-inner transition-all ${
        hasRoomId
          ? "hover:border-stone-600 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          : "cursor-not-allowed opacity-60"
      }`}
      title={hasRoomId ? t("lobby.clickToCopy") : t("lobby.waitingCode")}
    >
      <span className="text-5xl font-mono font-bold tracking-[0.2em] text-white">
        {roomId ?? "------"}
      </span>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
        {copied ? (
          <>
            <Check className="w-3 h-3 text-green-400" />
            <span className="text-green-400">{t("lobby.copied")}</span>
          </>
        ) : (
          <>
            <Copy
              className={`w-3 h-3 ${
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
