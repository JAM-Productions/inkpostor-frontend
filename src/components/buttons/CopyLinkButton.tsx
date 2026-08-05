import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Link as LinkIcon } from "lucide-react";

interface CopyLinkButtonProps {
  roomId: string;
}

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({ roomId }) => {
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    if (!roomId) return;
    try {
      const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopyLink}
      className="group relative inline-flex items-center justify-center gap-2 bg-stone-800/80 border border-stone-700/80 rounded-xl px-4 py-2 shadow-sm transition-[background-color,border-color,transform] hover:border-stone-600 hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      title={t("lobby.copyLink")}
    >
      {copiedLink ? (
        <>
          <Check className="size-4 text-green-400" />
          <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">
            {t("lobby.copied")}
          </span>
        </>
      ) : (
        <>
          <LinkIcon className="size-4 text-stone-400 group-hover:text-stone-300" />
          <span className="text-stone-400 group-hover:text-stone-300 text-xs font-semibold uppercase tracking-wider">
            {t("lobby.copyLink")}
          </span>
        </>
      )}
    </button>
  );
};
