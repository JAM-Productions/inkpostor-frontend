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
    <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400 h-fit">
            <PenLine className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("options.impostorGuess.title")}
            </h3>
            <p className="mt-1 text-sm text-stone-400">
              {t("options.impostorGuess.description")}
            </p>
            {isLocked && (
              <p
                className="mt-2 text-sm font-medium text-amber-400/90"
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
            className="flex h-8 w-14 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-800 text-stone-500"
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
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-semibold text-stone-300">
            {t("options.impostorGuess.attempts")}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!isHost || attempts <= MIN_IMPOSTOR_GUESSES}
              onClick={() => onAttemptsChange(-1)}
              className="flex size-8 items-center justify-center rounded-lg border border-stone-600 bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              aria-label={t("options.impostorGuess.decrease")}
            >
              <Minus className="size-4" />
            </button>
            <span
              className="w-6 text-center text-lg font-bold tabular-nums text-white"
              aria-live="polite"
              data-testid="impostor-guess-attempts-value"
            >
              {attempts}
            </span>
            <button
              type="button"
              disabled={!isHost || attempts >= MAX_IMPOSTOR_GUESSES}
              onClick={() => onAttemptsChange(1)}
              className="flex size-8 items-center justify-center rounded-lg border border-stone-600 bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              aria-label={t("options.impostorGuess.increase")}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div
          className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid="impostor-lose-on-last-attempt"
        >
          <div className="min-w-0">
            <span className="text-sm font-semibold text-stone-300">
              {t("options.impostorGuess.loseWhenOutOfGuesses.title")}
            </span>
            <p className="mt-1 text-sm text-stone-400">
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
