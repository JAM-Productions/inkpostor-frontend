import React from "react";
import { Check, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const roundTimes = [20, 25, 30, 35, 40];

interface RoundTimeSectionProps {
  isHost: boolean;
  onChange: (roundTime: number) => void;
  roundTime: number;
}

export const RoundTimeSection: React.FC<RoundTimeSectionProps> = ({
  isHost,
  onChange,
  roundTime,
}) => {
  const { t } = useTranslation();
  const selectedRoundTime = roundTimes.includes(roundTime)
    ? roundTime
    : roundTimes[0];

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
      <div className="flex gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 h-fit">
          <Clock3 className="size-5" />
        </div>
        <div className="w-full">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t("options.time.title")}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            {t("options.time.description")}
          </p>
          {isHost ? (
            <div
              className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-label={t("options.time.title")}
            >
              {roundTimes.map((value) => {
                const isSelected = value === selectedRoundTime;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onChange(value)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${isSelected ? "border-ink-primary bg-ink-primary/10 text-white" : "border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-600 hover:text-white"}`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span>{t(`options.time.options.${value}`)}</span>
                    <span
                      className={`flex size-5 items-center justify-center rounded-full border ${isSelected ? "border-ink-primary bg-ink-primary/20" : "border-stone-600"}`}
                    >
                      {isSelected && (
                        <Check className="size-3.5 text-ink-primary" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-white">
              <span>{t(`options.time.options.${selectedRoundTime}`)}</span>
              <span className="flex size-5 items-center justify-center rounded-full border border-ink-primary bg-ink-primary/20">
                <Check className="size-3.5 text-ink-primary" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
