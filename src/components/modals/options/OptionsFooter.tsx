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
        className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-rubik-wet-paint text-xl uppercase tracking-wider rounded-[16px_5px_18px_6px] border-2 border-stone-950 shadow-[4px_4px_0px_#0c0b09] transition-all hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
      >
        {t("options.confirm")}
      </button>
      <button
        type="button"
        data-testid="reset-options-button"
        onClick={onReset}
        aria-label={t("options.reset.toggle")}
        className="flex shrink-0 items-center justify-center gap-2 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-[#181512] px-4 py-3 font-handwritten text-lg font-bold text-amber-200 hover:bg-stone-800 transition-all hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] shadow-[3px_3px_0px_#0c0b09] cursor-pointer"
      >
        <Undo2 className="size-5 text-amber-400" />
        <span className="hidden sm:inline">{t("options.reset.label")}</span>
      </button>
    </div>
  );
};
