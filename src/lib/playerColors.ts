import { Player } from "../store/gameState";

const PLAYER_COLORS = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-purple-500 text-white",
  "bg-rose-500 text-white",
  "bg-indigo-500 text-white",
  "bg-cyan-500 text-white",
  "bg-teal-500 text-white",
  "bg-lime-500 text-white",
  "bg-fuchsia-500 text-white",
  "bg-sky-500 text-white",
];

export const getPlayerColorClass = (
  playerId: string | null,
  hostId: string | null,
  players: Player[],
): string => {
  if (!playerId) return "bg-stone-600 text-stone-300";

  if (playerId === hostId) {
    return "bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20";
  }

  // Find the index of the player in the list to assign a consistent color
  const playerIndex = players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1) return "bg-stone-700 text-stone-300";

  // Use modulo to cycle through colors if there are more players than colors
  return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
};
