import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Brush, Eye, Flame } from "lucide-react";
import { useGameStore } from "../store/gameState";

// Shown at the start of every HOT_WORD round: the word changed but the roles did
// not, so only the word is revealed here.
export const WordReveal: React.FC = () => {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const [isContinueButtonVisible, setIsContinueButtonVisible] = useState(false);
  const players = useGameStore((state) => state.players);
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const secretCategory = useGameStore((state) => state.secretCategory);
  const secretWord = useGameStore((state) => state.secretWord);
  const currentRound = useGameStore((state) => state.currentRound);
  const myId = useGameStore((state) => state.myId);
  const actions = useGameStore((state) => state.actions);

  const me = players.find((p) => p.id === myId);
  const hasConfirmed = me?.hasRevealedNewWord;
  // Ejected players may watch the reveal, but nobody waits for them: they get
  // no confirm button, just the waiting message.
  const isEjected = !!me?.isEjected;
  const pendingPlayers = players.filter((p) => !p.isEjected);

  const handleReveal = () => {
    setRevealed(true);
    setIsContinueButtonVisible(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink-bg px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 relative overflow-hidden">
      {/* Background ambient light */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-30 pointer-events-none transition-colors duration-1000 ${
          revealed ? "bg-amber-600" : "bg-amber-800"
        }`}
      />

      <div className="z-10 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-handwritten font-bold text-amber-200/70 uppercase tracking-widest">
            {t("wordReveal.round", { round: currentRound })}
          </h2>
          <h1 className="text-3xl sm:text-4xl font-rubik-wet-paint text-white tracking-wide">
            {t("wordReveal.title")}
          </h1>
        </div>

        <div className="relative">
          {/* Taped top corner accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-amber-100/30 border border-stone-400/40 rounded-sm transform rotate-1 z-20 pointer-events-none shadow-sm" />

          <button
            type="button"
            data-testid="reveal-word-card"
            onPointerDown={() => handleReveal()}
            onPointerUp={() => setRevealed(false)}
            onPointerCancel={() => setRevealed(false)}
            onPointerLeave={() => setRevealed(false)}
            onMouseDown={() => handleReveal()}
            onMouseUp={() => setRevealed(false)}
            onMouseLeave={() => setRevealed(false)}
            className={`w-full aspect-video rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 transition-colors duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer select-none animate-fade-in shadow-[6px_6px_0px_#0c0b09]
              ${
                revealed
                  ? "border-amber-500 bg-amber-950/80 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                  : "border-stone-950 bg-ink-surface hover:bg-stone-800 hover:-rotate-1"
              }`}
          >
            {revealed ? (
              <div className="animate-pop-in flex flex-col items-center gap-y-3 my-4 px-4">
                <Flame className="size-10 text-amber-400" />
                {amIImpostor ? (
                  <>
                    <p className="text-amber-200/90 font-handwritten font-bold uppercase tracking-widest text-base">
                      {t("wordReveal.impostorNoWord")}
                    </p>
                    <p className="text-amber-300 font-handwritten font-bold text-base px-4 py-1 bg-amber-900/60 rounded-[14px_4px_16px_4px] border-2 border-amber-500/50 shadow-[2px_2px_0px_#000]">
                      {secretCategory
                        ? t("wordReveal.hint", { category: secretCategory })
                        : t("wordReveal.noHint")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-amber-200/90 font-handwritten font-bold uppercase tracking-widest text-base">
                      {t("wordReveal.theWordIs")}
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-handwritten font-extrabold text-white drop-shadow-md">
                      {secretWord || ""}
                    </h3>
                    <p className="text-amber-300 font-handwritten font-bold px-4 py-1 bg-amber-900/60 rounded-[14px_4px_16px_4px] border-2 border-amber-500/50 text-base shadow-[2px_2px_0px_#000]">
                      {t("wordReveal.category", {
                        category: secretCategory || "",
                      })}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-amber-200/80 gap-3 transition-transform group-hover:scale-105">
                <Eye className="size-12 text-amber-400" />
                <span className="text-xl font-handwritten font-bold tracking-wide">
                  {t("wordReveal.pressHold")}
                </span>
              </div>
            )}
          </button>
        </div>

        <div className="pt-2" style={{ minHeight: "5rem" }}>
          {isEjected || hasConfirmed ? (
            <div className="text-amber-200/70 font-handwritten text-lg font-bold flex items-center justify-center gap-3 py-4.25 animate-fade-in">
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
              </span>
              {t("wordReveal.waitingPlayers", {
                count: pendingPlayers.filter((p) => p.hasRevealedNewWord)
                  .length,
                total: pendingPlayers.length,
              })}
            </div>
          ) : (
            isContinueButtonVisible && (
              <button
                type="button"
                data-testid="confirm-word-btn"
                onClick={actions.confirmNewWord}
                className="animate-fade-in-up flex items-center justify-center gap-2.5 w-full rounded-[22px_7px_18px_9px] border-3 border-stone-950 bg-amber-300 hover:bg-amber-200 text-stone-950 px-8 py-3.5 font-handwritten font-bold text-xl transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer shadow-[4px_4px_0px_#0c0b09]"
              >
                <Brush className="size-6 text-stone-950" />
                {t("wordReveal.startDrawing")}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
