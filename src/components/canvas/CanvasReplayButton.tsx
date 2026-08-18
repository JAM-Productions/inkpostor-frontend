import React from "react";
import { useTranslation } from "react-i18next";
import { Play, RotateCcw } from "lucide-react";

interface CanvasReplayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
}

/** Runs the drawing again from the first stroke. */
export const CanvasReplayButton: React.FC<CanvasReplayButtonProps> = ({
  isPlaying,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-testid="canvas-replay-btn"
      onClick={onClick}
      disabled={isPlaying}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[20px_6px_18px_8px] border-3 border-stone-950 bg-[#181512] py-3 font-handwritten text-lg font-bold text-amber-100 shadow-[4px_4px_0px_#0c0b09] transition-colors hover:-rotate-1 hover:bg-stone-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:rotate-0 disabled:hover:bg-[#181512] sm:text-xl"
    >
      {isPlaying ? (
        <Play className="size-5 text-amber-400" />
      ) : (
        <RotateCcw className="size-5 text-amber-400" />
      )}
      {isPlaying ? t("canvasPreview.playing") : t("canvasPreview.replay")}
    </button>
  );
};
