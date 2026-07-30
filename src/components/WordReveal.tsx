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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950 relative overflow-hidden">
      {/* Background ambient light */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[120px] rounded-full opacity-20 pointer-events-none transition-colors duration-1000 ${revealed ? "bg-amber-500" : "bg-blue-500"}`}
      />

      <div className="z-10 max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-stone-400">
            {t("wordReveal.round", { round: currentRound })}
          </h2>
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            {t("wordReveal.title")}
          </h1>
        </div>

        <div className="relative">
          {/* Same colours for everyone once revealed: the card must not tell a
              shoulder-surfer who the impostor is. */}
          <button
            type="button"
            onMouseDown={() => handleReveal()}
            onMouseUp={() => setRevealed(false)}
            onMouseLeave={() => setRevealed(false)}
            onTouchStart={() => handleReveal()}
            onTouchEnd={() => setRevealed(false)}
            className={`w-full aspect-video rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer select-none animate-fade-in
              ${
                revealed
                  ? "border-amber-500/50 bg-amber-950/40 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
                  : "border-stone-700 bg-stone-800 hover:bg-stone-750 hover:border-stone-600"
              }`}
          >
            {revealed ? (
              <div className="animate-in zoom-in-95 duration-200 fade-in flex flex-col items-center gap-y-4 my-4">
                <Flame className="size-10 text-amber-400" />
                {amIImpostor ? (
                  <>
                    <p className="text-amber-200/80 font-medium mb-0 uppercase tracking-widest text-sm">
                      {t("wordReveal.impostorNoWord")}
                    </p>
                    <p className="text-amber-400 font-medium px-4 py-1 bg-amber-900/50 rounded-full border border-amber-500/30 text-sm">
                      {t("wordReveal.hint", { category: secretCategory || "" })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-amber-200/80 font-medium mb-0 uppercase tracking-widest text-sm">
                      {t("wordReveal.theWordIs")}
                    </p>
                    <h3 className="text-4xl font-semibold text-white">
                      {secretWord || ""}
                    </h3>
                    <p className="text-amber-400 font-medium px-4 py-1 bg-amber-900/50 rounded-full border border-amber-500/30 text-sm">
                      {t("wordReveal.category", {
                        category: secretCategory || "",
                      })}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-stone-400 gap-4 transition-transform hover:scale-105">
                <Eye className="size-12" />
                <span className="text-lg font-medium">
                  {t("wordReveal.pressHold")}
                </span>
              </div>
            )}
          </button>
        </div>

        <div className="pt-3" style={{ minHeight: "4rem" }}>
          {isEjected || hasConfirmed ? (
            <div className="text-stone-500 flex items-center justify-center gap-3 text-sm sm:text-base py-3.5 animate-fade-in">
              <span className="relative flex size-2 sm:size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 sm:size-3 bg-stone-500"></span>
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
                onClick={actions.confirmNewWord}
                className="animate-fade-in-up flex items-center justify-center gap-2 w-full rounded-2xl bg-ink-secondary text-stone-900 px-8 py-3 font-bold text-lg transition-all hover:bg-white cursor-pointer active:scale-95 shadow-lg shadow-white/10"
              >
                <Brush className="size-5" />
                {t("wordReveal.startDrawing")}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
