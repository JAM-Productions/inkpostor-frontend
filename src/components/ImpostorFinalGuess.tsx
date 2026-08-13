import React from "react";
import { useTranslation } from "react-i18next";
import { Skull, PenLine } from "lucide-react";
import { useGameStore } from "../store/gameState";
import { ImpostorGuessForm } from "./ImpostorGuessForm";

export const ImpostorFinalGuess: React.FC = () => {
  const { t } = useTranslation();
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const actions = useGameStore((state) => state.actions);

  if (!amIImpostor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 p-4">
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
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#161412] px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-30 pointer-events-none bg-purple-950" />

      <div className="z-10 w-full max-w-md space-y-6 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 border-stone-950 bg-[#26221d] p-8 text-center shadow-[6px_6px_0px_#0c0b09] animate-fade-in relative">
        {/* Taped corner accent */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-amber-100/30 border border-stone-400/40 rounded-sm transform -rotate-1 pointer-events-none shadow-sm z-20" />

        <div className="flex justify-center">
          <div className="rounded-2xl border-2 border-stone-950 bg-red-950/80 p-4 text-red-400 shadow-[3px_3px_0px_#000]">
            <Skull className="size-12 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl text-white uppercase font-rubik-wet-paint tracking-wide">
            {t("impostorGuess.eliminatedTitle")}
          </h1>
          <p className="text-amber-200/90 font-handwritten text-lg font-bold">
            {t("impostorGuess.lastChance")}
          </p>
        </div>

        <div className="rounded-[18px_6px_20px_7px] border-3 border-stone-950 bg-purple-950/60 p-4 text-left shadow-[3px_3px_0px_#000]">
          <div className="mb-2 flex items-center gap-2 text-base font-handwritten font-bold uppercase tracking-wider text-purple-300">
            <PenLine className="size-5" />
            {t("impostorGuess.title")}
          </div>
          <ImpostorGuessForm autoFocus />
        </div>

        <button
          type="button"
          data-testid="skip-guess-btn"
          onClick={actions.skipImpostorGuess}
          className="w-full rounded-[16px_5px_18px_6px] border-2 border-stone-950 bg-[#181512] px-4 py-3 font-handwritten text-lg font-bold text-amber-200 hover:bg-stone-800 transition-all hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] shadow-[3px_3px_0px_#0c0b09] cursor-pointer"
        >
          {t("impostorGuess.skip")}
        </button>
      </div>
    </div>
  );
};
