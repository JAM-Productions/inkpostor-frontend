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
    <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className="rounded-xl bg-red-500/10 p-2 text-red-400 h-fit">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("options.impostorCount.title")}
            </h3>
            <p className="mt-1 text-sm text-stone-400">
              {t("options.impostorCount.description")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!isHost || count <= MIN_IMPOSTORS}
            onClick={() => onCountChange(-1)}
            className="flex size-8 items-center justify-center rounded-lg border border-stone-600 bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            aria-label={t("options.impostorCount.decrease")}
            data-testid="decrease-impostors-btn"
          >
            <Minus className="size-4" />
          </button>
          <span
            className="w-6 text-center text-lg font-bold tabular-nums text-white"
            aria-live="polite"
            data-testid="impostor-count-value"
          >
            {count}
          </span>
          <button
            type="button"
            disabled={!isHost || count >= maxImpostors}
            onClick={() => onCountChange(1)}
            className="flex size-8 items-center justify-center rounded-lg border border-stone-600 bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            aria-label={t("options.impostorCount.increase")}
            data-testid="increase-impostors-btn"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div
        className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3"
        data-testid="prevent-repeat-suboption"
      >
        <div className="min-w-0">
          <span className="text-sm font-semibold text-stone-300">
            {t("options.impostorCount.preventRepeat.title")}
          </span>
          <p className="mt-1 text-sm text-stone-400">
            {t("options.impostorCount.preventRepeat.description")}
          </p>
        </div>
        <OptionSwitch
          checked={preventRepeat}
          disabled={!isHost}
          label={t("options.impostorCount.preventRepeat.toggle")}
          onChange={onPreventRepeatChange}
          tone="purple"
        />
      </div>

      {count > 1 && (
        <div
          className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid="reveal-teammates-suboption"
        >
          <div className="min-w-0">
            <span className="text-sm font-semibold text-stone-300">
              {t("options.impostorCount.revealTeammates.title")}
            </span>
            <p className="mt-1 text-sm text-stone-400">
              {t("options.impostorCount.revealTeammates.description")}
            </p>
          </div>
          <OptionSwitch
            checked={revealTeammates}
            disabled={!isHost}
            label={t("options.impostorCount.revealTeammates.toggle")}
            onChange={onRevealTeammatesChange}
            tone="purple"
          />
        </div>
      )}
    </section>
  );
};
