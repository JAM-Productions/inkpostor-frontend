import React from "react";
import { useTranslation } from "react-i18next";
import { Skull, PenLine } from "lucide-react";
import { useGameStore } from "../store/gameState";
import { ImpostorGuessForm } from "./ImpostorGuessForm";
import { CanvasPreview } from "./canvas/CanvasPreview";

export const ImpostorFinalGuess: React.FC = () => {
  const { t } = useTranslation();
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const actions = useGameStore((state) => state.actions);

  if (!amIImpostor) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-stone-950 p-4">
        {/* `my-auto` centers the card but, unlike `justify-center`, lets it
            scroll instead of clipping when it grows taller than the viewport */}
        <div className="w-full max-w-md space-y-6 my-auto">
          {/* Nothing else competes for space on this screen, so the portrait
              box can take a good chunk of it */}
          <CanvasPreview className="max-w-[45vh] mx-auto sm:max-w-none" />
          <div className="text-stone-500 flex flex-col items-center gap-4 text-center">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-stone-500"></span>
            </span>
            <p className="animate-pulse text-base sm:text-lg">
              {t("impostorGuess.waitingFinalGuess")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-stone-950 p-4">
      <div className="w-full max-w-md space-y-5 sm:space-y-6 my-auto rounded-3xl border-2 border-purple-500/40 bg-stone-900/70 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-fade-in">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-red-500/10 p-4 text-red-400">
            <Skull className="size-12" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl text-white uppercase font-rubik-wet-paint font-extralight">
            {t("impostorGuess.eliminatedTitle")}
          </h1>
          <p className="text-stone-300 text-base sm:text-lg">
            {t("impostorGuess.lastChance")}
          </p>
        </div>

        {/* Tighter cap: this card also carries the guess form and the skip
            button, which must stay reachable without scrolling on a phone */}
        <CanvasPreview className="text-left max-w-[22vh] mx-auto sm:max-w-none" />

        <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-4 text-left">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-purple-300">
            <PenLine className="size-4" />
            {t("impostorGuess.title")}
          </div>
          <ImpostorGuessForm autoFocus />
        </div>

        <button
          type="button"
          onClick={actions.skipImpostorGuess}
          className="w-full rounded-xl border border-stone-600 bg-stone-800 px-4 py-2.5 font-bold text-stone-300 transition-all hover:bg-stone-700 hover:text-white active:scale-95 cursor-pointer"
        >
          {t("impostorGuess.skip")}
        </button>
      </div>
    </div>
  );
};
