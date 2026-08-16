import React from "react";
import { useTranslation } from "react-i18next";
import { getPlayerIconColorClass } from "../../lib/playerColors";
import type { Player } from "../../store/gameState";

interface EjectedPlayerCardProps {
  player: Player;
  hostId: string | null;
  /** The room, for the palette the avatar takes its colour from. */
  players: Player[];
}

/** The player the vote (or a kick) put out, stamped as ejected. */
export const EjectedPlayerCard: React.FC<EjectedPlayerCardProps> = ({
  player,
  hostId,
  players,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="ejected-player-card"
      className="relative flex items-center gap-3.5 rounded-[18px_6px_20px_8px] border-2 border-stone-700 bg-[#181512] px-4 py-3.5 text-left shadow-[4px_4px_0px_#000] animate-pop-in overflow-hidden max-w-full"
    >
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 font-handwritten text-xl font-bold shadow-[2px_2px_0px_#000] ${getPlayerIconColorClass(
          player.id,
          hostId,
          players,
        )}`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 pr-20">
        <p className="truncate font-handwritten text-xl font-bold tracking-wide text-stone-200">
          {player.name}
        </p>
      </div>
      <span className="absolute right-3 top-1/2 rounded border border-red-500/80 bg-red-950/80 px-2.5 py-0.5 font-rubik-wet-paint text-xs sm:text-sm text-red-400 uppercase tracking-widest pointer-events-none animate-stamp-in-centered animate-delay-500">
        {t("result.ejectedBadge")}
      </span>
    </div>
  );
};
