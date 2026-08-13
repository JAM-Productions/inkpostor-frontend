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
      className="group relative inline-flex items-center justify-center gap-2 bg-[#26221d] border-2 border-stone-950 rounded-[14px_4px_16px_5px] px-4 py-2 shadow-[3px_3px_0px_#0c0b09] transition-all hover:border-amber-400 hover:rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
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
