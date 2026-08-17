import React from "react";
import { useTranslation } from "react-i18next";
import { getPlayerIconColorClass } from "../lib/playerColors";
import { useGameStore, type Player } from "../store/gameState";

interface ImpostorPlayerCardProps {
  player: Player;
  hostId: string | null;
  /** Place in the revealed list, used to deal the cards one after another. */
  index?: number;
  /** How many cards the list holds, so the odd one out can place itself. */
  total?: number;
}

/**
 * An impostor on the results screen. Same card as the ejected player, with the
 * stamp naming what they were: when the table votes out loud there is nobody to
 * eject, so this list is the whole reveal.
 */
export const ImpostorPlayerCard: React.FC<ImpostorPlayerCardProps> = ({
  player,
  hostId,
  index = 0,
  total = 1,
}) => {
  const { t } = useTranslation();
  const players = useGameStore((state) => state.players);

  const isAloneInItsRow = total % 2 === 1 && index === total - 1;
  const placement = isAloneInItsRow
    ? "sm:col-span-2 sm:w-[calc(50%-0.3125rem)] sm:justify-self-center"
    : "";

  return (
    <div
      data-testid="impostor-result-card"
      style={{ animationDelay: `${index * 150}ms` }}
      className={`relative flex w-full items-center gap-3 rounded-[18px_6px_20px_7px] border-2 border-red-900 bg-[#181512] p-3 text-left shadow-[4px_4px_0px_#000] animate-pop-in sm:p-4 ${placement}`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 font-handwritten text-base font-bold shadow-[2px_2px_0px_#000] sm:size-12 sm:text-xl ${getPlayerIconColorClass(
          player.id,
          hostId,
          players,
        )}`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate font-handwritten text-base font-bold tracking-wide text-stone-200 sm:text-xl">
          {player.name}
        </p>
      </div>
      <span className="absolute -right-2 -top-2.5 rounded-sm border border-red-500/80 bg-red-950 px-1.5 py-px font-rubik-wet-paint text-[9px] text-red-400 uppercase tracking-wider pointer-events-none animate-stamp-in animate-delay-500">
        {t("result.impostorBadge")}
      </span>
    </div>
  );
};
