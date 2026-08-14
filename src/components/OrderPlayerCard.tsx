import React from "react";
import {
  getActivePlayerCardColorClass,
  getPlayerIconColorClass,
} from "../lib/playerColors";
import { useGameStore, type Player } from "../store/gameState";

interface OrderPlayerCardProps {
  player: Player;
  hostId: string | null;
  myId: string | null;
  /**
   * Place in the speaking order. Only set when the whole order is listed: the
   * standalone card is the answer on its own and doesn't need a "1." in front
   * of it.
   */
  position?: number;
}

/** A player on the ORDER_INFO screen, either alone or as a row of the order. */
export const OrderPlayerCard: React.FC<OrderPlayerCardProps> = ({
  player,
  hostId,
  myId,
  position,
}) => {
  const players = useGameStore((state) => state.players);
  const isStarterCard = position === undefined;

  const stagger =
    position === undefined
      ? undefined
      : { animationDelay: `${(position - 1) * 100}ms` };

  return (
    <div
      style={stagger}
      className={`flex items-center gap-3 rounded-[18px_6px_20px_8px] animate-fade-in-right ${
        isStarterCard
          ? `justify-center p-5 border-3 border-stone-950 shadow-[5px_5px_0px_#0c0b09] ${getActivePlayerCardColorClass(player.id, hostId, players)}`
          : `border-2 p-3.5 sm:p-4 shadow-[2px_2px_0px_#000] ${
              player.id === myId
                ? "bg-white/20 border-white/40"
                : "bg-stone-900 border-stone-800"
            }`
      }`}
    >
      {!isStarterCard && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 bg-stone-900 text-sm font-handwritten font-bold tabular-nums text-amber-200 shadow-[1px_1px_0px_#000]">
          {position}
        </span>
      )}
      <div
        className={`flex items-center justify-center rounded-full font-handwritten font-bold border-2 border-stone-950 shadow-[2px_2px_0px_#000] ${
          isStarterCard
            ? "size-14 text-2xl"
            : "size-9 sm:size-11 text-base sm:text-xl"
        } ${getPlayerIconColorClass(player.id, hostId, players)}`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <span
        className={`font-handwritten font-bold text-white tracking-wide ${
          isStarterCard ? "text-3xl" : "text-lg sm:text-xl"
        }`}
      >
        {player.name}
      </span>
    </div>
  );
};
