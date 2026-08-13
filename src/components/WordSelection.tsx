import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useGameStore } from "../store/gameState";
import {
  isSpokenMode,
  MAX_CUSTOM_WORD_LENGTH,
  MIN_CUSTOM_WORD_LENGTH,
} from "../lib/constants";

export const WordSelection: React.FC = () => {
  const { t } = useTranslation();
  const [word, setWord] = useState("");
  const players = useGameStore((state) => state.players);
  const myId = useGameStore((state) => state.myId);
  const gameMode = useGameStore((state) => state.gameMode);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#161412] px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-30 pointer-events-none bg-red-950" />

      <div className="z-10 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-rubik-wet-paint text-white tracking-wide">
            {t("wordSelection.title")}
          </h1>
          <p className="text-amber-200/80 font-handwritten text-lg pt-1">
            {t(
              isSpokenMode(gameMode)
                ? "wordSelection.descriptionSpoken"
                : "wordSelection.description",
            )}
          </p>
        </div>

        {!hasSubmitted ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 animate-fade-in bg-[#26221d] p-6 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09] relative"
          >
            {/* Taped corner accent */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-amber-100/30 border border-stone-400/40 rounded-sm transform -rotate-1 pointer-events-none shadow-sm" />

            <input
              type="text"
              data-testid="custom-word-input"
              value={word}
              autoFocus
              onChange={(e) => setWord(e.target.value)}
              placeholder={t("wordSelection.placeholder")}
              aria-label={t("wordSelection.placeholder")}
              maxLength={MAX_CUSTOM_WORD_LENGTH}
              className="w-full rounded-[18px_6px_20px_7px] border-2 border-stone-700 focus:border-amber-400 bg-[#181512] px-4 py-3.5 text-center text-2xl font-handwritten text-white placeholder-stone-500 outline-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)] transition-colors transition-transform"
            />
            <button
              type="submit"
              data-testid="submit-custom-word-btn"
              disabled={!isValid}
              className="flex w-full items-center justify-center gap-2 rounded-[20px_6px_18px_8px] border-3 border-stone-950 bg-amber-300 hover:bg-amber-200 px-8 py-3.5 text-xl font-handwritten font-bold text-stone-950 shadow-[4px_4px_0px_#0c0b09] transition-colors transition-transform hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:rotate-0 disabled:active:translate-x-0 disabled:active:translate-y-0 cursor-pointer"
            >
              {t("wordSelection.submit")}
            </button>
            <p className="text-sm font-handwritten text-amber-200/60">
              {t("wordSelection.hint")}
            </p>
          </form>
        ) : (
          <div className="space-y-4 animate-fade-in bg-[#26221d] p-6 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09]">
            <div className="flex items-center justify-center gap-2 rounded-[16px_5px_18px_6px] border-2 border-emerald-500 bg-emerald-950/80 px-4 py-3 text-emerald-300 font-handwritten text-lg font-bold shadow-[2px_2px_0px_#000]">
              <Check className="size-6 text-emerald-400" />
              <span>{t("wordSelection.submitted")}</span>
            </div>
            <div className="flex items-center justify-center gap-3 py-3 text-lg text-amber-200/70 font-handwritten font-bold">
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
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
