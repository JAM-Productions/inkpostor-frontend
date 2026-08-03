import React from "react";
import { useTranslation } from "react-i18next";
import { Maximize2 } from "lucide-react";
import { useModalStore } from "../../store/modalStore";
import { CanvasPreview } from "./CanvasPreview";

interface CanvasPreviewThumbnailProps {
  className?: string;
}

/**
 * Compact, tappable strip of the shared canvas that opens the full preview in a
 * modal. Used on screens that are already crowded on mobile (voting), where a
 * full-size preview would push the important controls off-screen.
 */
export const CanvasPreviewThumbnail: React.FC<CanvasPreviewThumbnailProps> = ({
  className = "",
}) => {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.actions.openModal);

  return (
    <button
      type="button"
      onClick={() => openModal("CANVAS_PREVIEW")}
      aria-label={t("canvasPreview.open")}
      className={`group relative block w-full cursor-pointer rounded-2xl transition-transform active:scale-[0.99] ${className}`}
    >
      {/* A flat strip rather than the device shape: this is a teaser on an
          already crowded screen, the modal is where the drawing is inspected */}
      <CanvasPreview showLabel={false} boxClassName="h-24 sm:h-28" />

      <span className="pointer-events-none absolute top-2 right-2 flex items-center gap-1.5 rounded-lg bg-stone-900/80 px-2 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-300 backdrop-blur-sm transition-colors group-hover:text-white">
        <Maximize2 className="size-3.5" />
        {t("canvasPreview.open")}
      </span>
    </button>
  );
};
