import React from "react";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";
import { useGameStore, type Player } from "../../store/gameState";
import { useSoundStore } from "../../store/soundStore";

interface NextRoundActionsProps {
  players: Player[];
  hasConfirmedNewRound: boolean;
  amIEjected: boolean;
}

/**
 * What a round result offers: the next round, once everyone still playing has
 * asked for it. Ejected players get no button — nobody waits for them — so they
 * see the same counter as anyone who already confirmed.
 */
export const NextRoundActions: React.FC<NextRoundActionsProps> = ({
  players,
  hasConfirmedNewRound,
  amIEjected,
}) => {
  const { t } = useTranslation();
  const actions = useGameStore((state) => state.actions);
  const playSound = useSoundStore((state) => state.actions.playSound);

  if (hasConfirmedNewRound || amIEjected) {
    const pending = players.filter((p) => !p.isEjected && p.isConnected);
    return (
      <div className="text-amber-200/70 font-handwritten font-bold text-lg flex items-center justify-center gap-3 py-4.75 animate-fade-in min-h-14">
        <span className="relative flex size-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
        </span>
        {t("result.waitingPlayers", {
          count: pending.filter((p) => p.hasConfirmedNewRound).length,
          total: pending.length,
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid="next-round-btn"
      onClick={() => {
        playSound("click");
        actions.nextRound();
      }}
      className="w-full min-h-14 cursor-pointer group relative overflow-hidden rounded-[22px_7px_18px_9px] border-3 border-stone-950 transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] shadow-[4px_4px_0px_#0c0b09] bg-amber-300 hover:bg-amber-200 text-stone-950 animate-fade-in animate-delay-2000 animate-duration-slower"
    >
      <div className="flex h-full w-full items-center justify-center gap-2.5 px-8 py-3.5">
        <Play className="fill-stone-950 size-6 text-stone-950" />
        <span className="sm:text-2xl text-xl font-handwritten font-bold uppercase">
          {t("result.nextRound")}
        </span>
      </div>
    </button>
  );
};
