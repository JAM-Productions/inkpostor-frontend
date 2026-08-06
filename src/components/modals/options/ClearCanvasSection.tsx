import React from "react";
import { Eraser, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OptionSection } from "./OptionSection";
import { OptionSwitch } from "./OptionSwitch";

interface ClearCanvasSectionProps {
  checked: boolean;
  isHost: boolean;
  isLocked: boolean;
  modeName: string;
  onChange: () => void;
}

export const ClearCanvasSection: React.FC<ClearCanvasSectionProps> = ({
  checked,
  isHost,
  isLocked,
  modeName,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <OptionSection
      icon={<Eraser className="size-5" />}
      iconClassName="bg-amber-500/10 text-amber-400"
      title={t("options.clearCanvas.title")}
      description={t("options.clearCanvas.description")}
      notice={
        isLocked && (
          <p
            className="mt-2 text-sm font-medium text-amber-400/90"
            data-testid="clear-canvas-locked-notice"
          >
            {t("options.clearCanvas.alwaysOnInMode", { mode: modeName })}
          </p>
        )
      }
    >
      {isLocked ? (
        <div
          className="flex h-8 w-14 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-800 text-stone-500"
          data-testid="clear-canvas-locked"
          aria-hidden="true"
        >
          <Lock className="size-4" />
        </div>
      ) : (
        <OptionSwitch
          checked={checked}
          disabled={!isHost}
          label={t("options.clearCanvas.toggle")}
          onChange={onChange}
          tone="amber"
        />
      )}
    </OptionSection>
  );
};
