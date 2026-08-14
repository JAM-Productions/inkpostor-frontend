import React from "react";
import { Minus, Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MIN_IMPOSTORS } from "../../../lib/constants";
import { OptionSwitch } from "./OptionSwitch";

interface ImpostorCountSectionProps {
  count: number;
  maxImpostors: number;
  revealTeammates: boolean;
  preventRepeat: boolean;
  isHost: boolean;
  onCountChange: (delta: number) => void;
  onRevealTeammatesChange: () => void;
  onPreventRepeatChange: () => void;
}

export const ImpostorCountSection: React.FC<ImpostorCountSectionProps> = ({
  count,
  maxImpostors,
  revealTeammates,
  preventRepeat,
  isHost,
  onCountChange,
  onRevealTeammatesChange,
  onPreventRepeatChange,
}) => {
  const { t } = useTranslation();

  return (
    <section className="rounded-[18px_6px_20px_7px] border-2 border-stone-950 bg-[#181512] p-4 sm:p-5 shadow-[3px_3px_0px_#0c0b09]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className="rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-red-950/80 p-2.5 text-red-400 h-fit shadow-[2px_2px_0px_#000]">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-handwritten font-bold uppercase tracking-wider text-white">
              {t("options.impostorCount.title")}
            </h3>
            <p className="mt-0.5 text-base font-handwritten text-amber-200/70">
              {t("options.impostorCount.description")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!isHost || count <= MIN_IMPOSTORS}
            onClick={() => onCountChange(-1)}
            className="flex size-9 items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-ink-surface text-ink-primary shadow-[2px_2px_0px_#000] hover:-rotate-3 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:rotate-0 cursor-pointer"
            aria-label={t("options.impostorCount.decrease")}
            data-testid="decrease-impostors-btn"
          >
            <Minus className="size-5 stroke-3" />
          </button>
          <span
            className="w-6 text-center text-xl font-handwritten font-extrabold tabular-nums text-white"
            aria-live="polite"
            data-testid="impostor-count-value"
          >
            {count}
          </span>
          <button
            type="button"
            disabled={!isHost || count >= maxImpostors}
            onClick={() => onCountChange(1)}
            className="flex size-9 items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-ink-surface text-ink-primary shadow-[2px_2px_0px_#000] hover:rotate-3 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:rotate-0 cursor-pointer"
            aria-label={t("options.impostorCount.increase")}
            data-testid="increase-impostors-btn"
          >
            <Plus className="size-5 stroke-3" />
          </button>
        </div>
      </div>

      <div
        className="mt-4 pt-4 border-t-2 border-dashed border-stone-700 flex items-center justify-between gap-4"
        data-testid="prevent-repeat-suboption"
      >
        <div className="min-w-0 font-handwritten">
          <span className="text-base font-bold text-amber-100">
            {t("options.impostorCount.preventRepeat.title")}
          </span>
          <p className="mt-0.5 text-base text-amber-200/70">
            {t("options.impostorCount.preventRepeat.description")}
          </p>
        </div>
        <OptionSwitch
          checked={preventRepeat}
          disabled={!isHost}
          label={t("options.impostorCount.preventRepeat.toggle")}
          onChange={onPreventRepeatChange}
          tone="red"
        />
      </div>

      {count > 1 && (
        <div
          className="mt-3 flex items-center justify-between gap-4 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-ink-surface px-4 py-3 shadow-[2px_2px_0px_#000] animate-slide-pop-in"
          data-testid="reveal-teammates-suboption"
        >
          <div className="min-w-0 font-handwritten">
            <span className="text-base font-bold text-amber-100">
              {t("options.impostorCount.revealTeammates.title")}
            </span>
            <p className="mt-0.5 text-base text-amber-200/70">
              {t("options.impostorCount.revealTeammates.description")}
            </p>
          </div>
          <OptionSwitch
            checked={revealTeammates}
            disabled={!isHost}
            label={t("options.impostorCount.revealTeammates.toggle")}
            onChange={onRevealTeammatesChange}
            tone="red"
          />
        </div>
      )}
    </section>
  );
};
