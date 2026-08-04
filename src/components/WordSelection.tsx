import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useGameStore } from "../store/gameState";
import {
  MAX_CUSTOM_WORD_LENGTH,
  MIN_CUSTOM_WORD_LENGTH,
} from "../lib/constants";

export const WordSelection: React.FC = () => {
  const { t } = useTranslation();
  const [word, setWord] = useState("");
  const players = useGameStore((state) => state.players);
  const myId = useGameStore((state) => state.myId);
  const actions = useGameStore((state) => state.actions);

  const me = players.find((p) => p.id === myId);
  const hasSubmitted = !!me?.hasSubmittedWord;
  const isValid = word.trim().length >= MIN_CUSTOM_WORD_LENGTH;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || hasSubmitted) return;
    actions.submitCustomWord(word);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[120px] rounded-full opacity-20 pointer-events-none bg-ink-primary" />

      <div className="z-10 max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            {t("wordSelection.title")}
          </h1>
          <p className="text-stone-400 text-sm pt-2">
            {t("wordSelection.description")}
          </p>
        </div>

        {!hasSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <input
              type="text"
              data-testid="custom-word-input"
              value={word}
              autoFocus
              onChange={(e) => setWord(e.target.value)}
              placeholder={t("wordSelection.placeholder")}
              aria-label={t("wordSelection.placeholder")}
              maxLength={MAX_CUSTOM_WORD_LENGTH}
              className="w-full rounded-2xl border-2 border-stone-700 bg-stone-900 px-4 py-3 text-center text-xl text-white placeholder-stone-500 focus:border-ink-primary focus:outline-none"
            />
            <button
              type="submit"
              data-testid="submit-custom-word-btn"
              disabled={!isValid}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-secondary px-8 py-3 text-lg font-bold text-stone-900 shadow-lg shadow-white/10 transition-[background-color,scale,opacity] hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {t("wordSelection.submit")}
            </button>
            <p className="text-xs text-stone-500">{t("wordSelection.hint")}</p>
          </form>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-emerald-300">
              <Check className="size-5" />
              <span className="font-medium">
                {t("wordSelection.submitted")}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 py-3.5 text-sm text-stone-500 sm:text-base">
              <span className="relative flex size-2 sm:size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 sm:size-3 bg-stone-500"></span>
              </span>
              {t("wordSelection.waitingPlayers", {
                count: players.filter((p) => p.hasSubmittedWord).length,
                total: players.length,
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
