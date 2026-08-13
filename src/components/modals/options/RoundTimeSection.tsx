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
    <section className="rounded-[18px_6px_20px_7px] border-2 border-stone-950 bg-[#181512] p-4 sm:p-5 shadow-[3px_3px_0px_#0c0b09]">
      <div className="flex gap-3">
        <div className="rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-blue-950/80 p-2.5 text-blue-300 h-fit shadow-[2px_2px_0px_#000]">
          <Clock3 className="size-5" />
        </div>
        <div className="w-full">
          <h3 className="text-base font-handwritten font-bold uppercase tracking-wider text-white">
            {t("options.time.title")}
          </h3>
          <p className="mt-0.5 text-base font-handwritten text-amber-200/70">
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
                    className={`flex items-center justify-between rounded-[14px_4px_16px_5px] border-2 px-4 py-3 text-left transition-colors transition-transform cursor-pointer font-handwritten text-lg font-bold ${
                      isSelected
                        ? "border-stone-950 bg-amber-400 text-stone-950 shadow-[3px_3px_0px_#000] -rotate-1"
                        : "border-stone-950 bg-[#26221d] text-amber-100 shadow-[2px_2px_0px_#000] hover:border-amber-400/60 hover:-rotate-1"
                    }`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span>{t(`options.time.options.${value}`)}</span>
                    <span
                      className={`flex size-5 items-center justify-center rounded-full border-2 border-stone-950 ${
                        isSelected
                          ? "bg-stone-950 text-amber-400"
                          : "bg-[#181512] text-transparent"
                      }`}
                    >
                      {isSelected && (
                        <Check className="size-3.5 stroke-[3] text-amber-400" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-[#26221d] px-4 py-3 text-white font-handwritten text-lg font-bold shadow-[2px_2px_0px_#000]">
              <span>{t(`options.time.options.${selectedRoundTime}`)}</span>
              <span className="flex size-5 items-center justify-center rounded-full border-2 border-stone-950 bg-amber-400 text-stone-950">
                <Check className="size-3.5 stroke-[3] text-stone-950" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
