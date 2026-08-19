import React from "react";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { useModalStore } from "../../store/modalStore";

/** Opens the round's drawing during the vote, where there is no room to show it. */
export const CanvasPreviewButton: React.FC = () => {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.actions.openModal);

  return (
    <button
      type="button"
      data-testid="open-canvas-preview-btn"
      onClick={() => openModal("CANVAS_PREVIEW")}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[20px_6px_18px_8px] border-3 border-stone-950 bg-[#181512] py-3 font-handwritten text-lg font-bold text-amber-100 shadow-[4px_4px_0px_#0c0b09] transition-colors hover:-rotate-1 hover:border-amber-400/70 hover:bg-stone-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] sm:text-xl"
    >
      <Eye className="size-5 text-amber-400" />
      {t("voting.viewCanvas")}
    </button>
  );
};
