import React from "react";
import { Lock, Minus, PenLine, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  MAX_IMPOSTOR_GUESSES,
  MIN_IMPOSTOR_GUESSES,
} from "../../../lib/constants";
import { OptionSwitch } from "./OptionSwitch";

interface ImpostorGuessSectionProps {
  attempts: number;
  enabled: boolean;
  isHost: boolean;
  isLocked: boolean;
  losesWhenOutOfGuesses: boolean;
  modeName: string;
  onAttemptsChange: (delta: number) => void;
  onEnabledChange: () => void;
  onLosesWhenOutOfGuessesChange: () => void;
}

export const ImpostorGuessSection: React.FC<ImpostorGuessSectionProps> = ({
  attempts,
  enabled,
  isHost,
  isLocked,
  losesWhenOutOfGuesses,
  modeName,
  onAttemptsChange,
  onEnabledChange,
  onLosesWhenOutOfGuessesChange,
}) => {
  const { t } = useTranslation();

  return (
    <section className="rounded-[18px_6px_20px_7px] border-2 border-stone-950 bg-[#181512] p-4 sm:p-5 shadow-[3px_3px_0px_#0c0b09]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className="rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-purple-950/80 p-2.5 text-purple-300 h-fit shadow-[2px_2px_0px_#000]">
            <PenLine className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-handwritten font-bold uppercase tracking-wider text-white">
              {t("options.impostorGuess.title")}
            </h3>
            <p className="mt-0.5 text-base font-handwritten text-amber-200/70">
              {t("options.impostorGuess.description")}
            </p>
            {isLocked && (
              <p
                className="mt-2 text-base font-handwritten font-bold text-amber-400/90"
                data-testid="impostor-guess-unavailable"
              >
                {t("options.impostorGuess.unavailableInMode", {
                  mode: modeName,
                })}
              </p>
            )}
          </div>
        </div>
        {isLocked ? (
          <div
            className="flex h-8 w-14 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 bg-[#26221d] text-stone-500 shadow-[2px_2px_0px_#000]"
            data-testid="impostor-guess-locked"
            aria-hidden="true"
          >
            <Lock className="size-4" />
          </div>
        ) : (
          <OptionSwitch
            checked={enabled}
            disabled={!isHost}
            label={t("options.impostorGuess.toggle")}
            onChange={onEnabledChange}
            tone="purple"
          />
        )}
      </div>

      {enabled && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-[#26221d] px-4 py-3 shadow-[2px_2px_0px_#000] animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-base font-handwritten font-bold text-amber-100">
            {t("options.impostorGuess.attempts")}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!isHost || attempts <= MIN_IMPOSTOR_GUESSES}
              onClick={() => onAttemptsChange(-1)}
              className="flex size-9 items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-[#181512] text-purple-300 shadow-[2px_2px_0px_#000] hover:-rotate-3 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-colors transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:rotate-0 cursor-pointer"
              aria-label={t("options.impostorGuess.decrease")}
              data-testid="decrease-guesses-btn"
            >
              <Minus className="size-5 stroke-[3]" />
            </button>
            <span
              className="w-6 text-center text-xl font-handwritten font-extrabold tabular-nums text-white"
              aria-live="polite"
              data-testid="impostor-guess-attempts-value"
            >
              {attempts}
            </span>
            <button
              type="button"
              disabled={!isHost || attempts >= MAX_IMPOSTOR_GUESSES}
              onClick={() => onAttemptsChange(1)}
              className="flex size-9 items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-[#181512] text-purple-300 shadow-[2px_2px_0px_#000] hover:rotate-3 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-colors transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:rotate-0 cursor-pointer"
              aria-label={t("options.impostorGuess.increase")}
              data-testid="increase-guesses-btn"
            >
              <Plus className="size-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div
          className="mt-3 flex items-center justify-between gap-4 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-[#26221d] px-4 py-3 shadow-[2px_2px_0px_#000] animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid="impostor-lose-on-last-attempt"
        >
          <div className="min-w-0 font-handwritten">
            <span className="text-base font-bold text-amber-100">
              {t("options.impostorGuess.loseWhenOutOfGuesses.title")}
            </span>
            <p className="mt-0.5 text-base text-amber-200/70">
              {t("options.impostorGuess.loseWhenOutOfGuesses.description")}
            </p>
          </div>
          <OptionSwitch
            checked={losesWhenOutOfGuesses}
            disabled={!isHost}
            label={t("options.impostorGuess.loseWhenOutOfGuesses.toggle")}
            onChange={onLosesWhenOutOfGuessesChange}
            tone="purple"
          />
        </div>
      )}
    </section>
  );
};
