import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { isSpokenMode } from "../lib/constants";
import { Brush, Eye, Play } from "lucide-react";

export const RoleReveal: React.FC = () => {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const [isContinueButtonVisible, setIsContinueButtonVisible] = useState(false);
  const players = useGameStore((state) => state.players);
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const impostorTeammates = useGameStore((state) => state.impostorTeammates);
  const secretCategory = useGameStore((state) => state.secretCategory);
  const secretWord = useGameStore((state) => state.secretWord);
  const myId = useGameStore((state) => state.myId);
  const gameMode = useGameStore((state) => state.gameMode);
  const actions = useGameStore((state) => state.actions);

  const me = players.find((p) => p.id === myId);
  const hasPlayerRevealedRoleAndContinued = me?.hasRevealedRole;

  const isSpoken = isSpokenMode(gameMode);

  const handleReveal = () => {
    setRevealed(true);
    setIsContinueButtonVisible(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#161412] px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 relative overflow-hidden">
      {/* Background ambient light */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-30 pointer-events-none transition-colors duration-1000 ${
          revealed
            ? amIImpostor
              ? "bg-red-600"
              : "bg-emerald-600"
            : "bg-amber-600"
        }`}
      />

      <div className="z-10 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-handwritten font-bold text-amber-200/70 uppercase tracking-widest">
            {t("roleReveal.phase1")}
          </h2>
          <h1 className="text-3xl sm:text-4xl font-rubik-wet-paint text-white tracking-wide">
            {t("roleReveal.yourSecretRole")}
          </h1>
        </div>

        <div className="relative">
          {/* Taped top corner accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-amber-100/30 border border-stone-400/40 rounded-sm transform -rotate-1 z-20 pointer-events-none shadow-sm" />

          <button
            type="button"
            data-testid="reveal-role-card"
            onPointerDown={() => handleReveal()}
            onPointerUp={() => setRevealed(false)}
            onPointerCancel={() => setRevealed(false)}
            onPointerLeave={() => setRevealed(false)}
            onMouseDown={() => handleReveal()}
            onMouseUp={() => setRevealed(false)}
            onMouseLeave={() => setRevealed(false)}
            className={`w-full aspect-video rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 transition-colors transition-transform duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer select-none animate-fade-in shadow-[6px_6px_0px_#0c0b09]
              ${
                revealed
                  ? amIImpostor
                    ? "border-red-600 bg-red-950/80 shadow-[0_0_40px_rgba(220,38,38,0.3)]"
                    : "border-emerald-600 bg-emerald-950/80 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                  : "border-stone-950 bg-[#26221d] hover:bg-stone-800 hover:-rotate-1"
              }`}
          >
            {revealed ? (
              <div className="animate-pop-in flex flex-col items-center gap-y-3 my-4 px-4">
                {amIImpostor ? (
                  <>
                    <img
                      src="/inkpostor-character.webp"
                      alt="Inkpostor Logo"
                      className="h-20 drop-shadow-md"
                    />
                    <h3 className="text-2xl sm:text-3xl font-rubik-wet-paint text-white tracking-widest uppercase">
                      {t("roleReveal.youAreInkpostor")} <br />
                      <span className="text-red-500">
                        {t("roleReveal.inkpostor")}
                      </span>
                    </h3>
                    <p className="text-red-200 font-handwritten font-bold text-base px-4 py-1 bg-red-900/60 rounded-[14px_4px_16px_4px] border-2 border-red-500/50 shadow-[2px_2px_0px_#000]">
                      {secretCategory
                        ? t("roleReveal.hint", { category: secretCategory })
                        : t("roleReveal.noHint")}
                    </p>
                    {impostorTeammates && impostorTeammates.length > 0 && (
                      <p
                        className="text-red-300 font-handwritten font-bold text-sm px-4 py-1.5 bg-red-950/80 rounded-[14px_4px_16px_4px] border-2 border-red-500/40 max-w-xs text-center shadow-[2px_2px_0px_#000]"
                        data-testid="impostor-teammates"
                      >
                        {t("roleReveal.otherImpostors", {
                          names: impostorTeammates.join(", "),
                        })}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <img
                      src="/no-inkpostor-character.webp"
                      alt="No Inkpostor Logo"
                      className="h-20 drop-shadow-md"
                    />
                    <p className="text-emerald-200/90 font-handwritten font-bold mb-0 uppercase tracking-widest text-base">
                      {t("roleReveal.theWordIs")}
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-handwritten font-extrabold text-white drop-shadow-md">
                      {secretWord || ""}
                    </h3>
                    <p className="text-emerald-300 font-handwritten font-bold px-4 py-1 bg-emerald-900/60 rounded-[14px_4px_16px_4px] border-2 border-emerald-500/50 text-base shadow-[2px_2px_0px_#000]">
                      {t("roleReveal.category", {
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
                  {t("roleReveal.pressHold")}
                </span>
              </div>
            )}
          </button>
        </div>

        <div className="pt-2" style={{ minHeight: "4rem" }}>
          {(isContinueButtonVisible || hasPlayerRevealedRoleAndContinued) &&
            (!hasPlayerRevealedRoleAndContinued ? (
              <button
                type="button"
                data-testid="proceed-to-drawing-btn"
                onClick={actions.proceedToDrawing}
                className="animate-fade-in-up flex items-center justify-center gap-2.5 w-full rounded-[22px_7px_18px_9px] border-3 border-stone-950 bg-amber-300 hover:bg-amber-200 text-stone-950 px-8 py-3.5 font-handwritten font-bold text-xl transition-colors transition-transform hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer shadow-[4px_4px_0px_#0c0b09]"
              >
                {isSpoken ? (
                  <Play className="size-6 fill-current text-stone-950" />
                ) : (
                  <Brush className="size-6 text-stone-950" />
                )}
                {t(isSpoken ? "roleReveal.start" : "roleReveal.startDrawing")}
              </button>
            ) : (
              <div className="text-amber-200/70 font-handwritten text-lg font-bold flex items-center justify-center gap-3 py-3.5 animate-fade-in">
                <span className="relative flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
                </span>
                {t("roleReveal.waitingPlayers", {
                  count: players.filter((p) => p.hasRevealedRole).length,
                  total: players.length,
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
