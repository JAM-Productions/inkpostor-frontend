import React from "react";
import { useTranslation } from "react-i18next";
import { Undo } from "lucide-react";

interface UndoButtonProps {
  onClick: () => void;
  isUndoOnly?: boolean;
}

export const UndoButton: React.FC<UndoButtonProps> = ({
  onClick,
  isUndoOnly = false,
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl shrink-0 cursor-pointer bg-stone-700 flex items-center justify-center gap-2 text-stone-300 hover:bg-stone-600 transition-colors active:scale-95 ${
        isUndoOnly ? "h-10 px-4" : "size-10"
      }`}
      title={t("canvas.undo")}
      aria-label="Undo last stroke"
    >
      <Undo className="size-5" />
      {isUndoOnly && (
        <span className="text-sm font-bold uppercase tracking-wider">
          {t("canvas.undo")}
        </span>
      )}
    </button>
  );
};
