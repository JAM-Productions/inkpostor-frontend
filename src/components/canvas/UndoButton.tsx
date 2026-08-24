import { Undo } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSoundStore } from "../../store/soundStore";

interface UndoButtonProps {
  onUndo: () => void;
  showLabel?: boolean;
}

export function UndoButton({ onUndo, showLabel = false }: UndoButtonProps) {
  const { t } = useTranslation();
  const playSound = useSoundStore((state) => state.actions.playSound);

  const handleClick = () => {
    playSound("undo");
    onUndo();
  };

  return (
    <button
      type="button"
      data-testid="undo-stroke-btn"
      onClick={handleClick}
      className={`flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[14px_4px_16px_4px] border-2 border-stone-950 bg-[#181512] text-amber-200 shadow-[2px_2px_0px_#000] transition-colors hover:-rotate-1 hover:bg-stone-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] ${showLabel ? "h-10 px-4" : "size-10"}`}
      title={t("canvas.undo")}
      aria-label="Undo last stroke"
    >
      <Undo className="size-5 text-amber-300" />
      {showLabel && (
        <span className="font-handwritten text-sm font-bold uppercase tracking-wider">
          {t("canvas.undo")}
        </span>
      )}
    </button>
  );
}
