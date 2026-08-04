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
      className={`flex items-center gap-3 rounded-2xl animate-fade-in-right ${
        isStarterCard
          ? `justify-center p-5 ${getActivePlayerCardColorClass(player.id, hostId, players)}`
          : `border p-3 sm:p-4 ${
              player.id === myId
                ? "bg-white/20 border-white/40"
                : "bg-stone-900 border-stone-700/50"
            }`
      }`}
    >
      {!isStarterCard && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-stone-600 bg-stone-950/60 text-sm font-bold tabular-nums text-white">
          {position}
        </span>
      )}
      <div
        className={`flex items-center justify-center rounded-full font-bold ${
          isStarterCard
            ? "size-12 text-xl"
            : "size-8 sm:size-10 text-sm sm:text-lg"
        } ${getPlayerIconColorClass(player.id, hostId, players)}`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <span
        className={`font-semibold text-white ${
          isStarterCard ? "text-2xl" : "text-sm sm:text-lg"
        }`}
      >
        {player.name}
      </span>
    </div>
  );
};
