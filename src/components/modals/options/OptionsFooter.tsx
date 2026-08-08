import React from "react";
import { Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OptionsFooterProps {
  onConfirm: () => void;
  onReset: () => void;
}

export const OptionsFooter: React.FC<OptionsFooterProps> = ({
  onConfirm,
  onReset,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3">
      <button
        type="button"
        data-testid="confirm-options-button"
        onClick={onConfirm}
        className="flex-1 py-3 bg-ink-primary hover:bg-ink-primary-accent text-white font-bold rounded-xl transition-colors transition-transform active:scale-[0.98] cursor-pointer uppercase"
      >
        {t("options.confirm")}
      </button>
      <button
        type="button"
        data-testid="reset-options-button"
        onClick={onReset}
        aria-label={t("options.reset.toggle")}
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-800 px-3.5 py-3 text-sm font-semibold uppercase text-stone-300 transition-colors transition-transform hover:bg-stone-700 hover:text-white active:scale-[0.98] cursor-pointer sm:px-4"
      >
        <Undo2 className="size-4" />
        <span className="hidden sm:inline">{t("options.reset.label")}</span>
      </button>
    </div>
  );
};
