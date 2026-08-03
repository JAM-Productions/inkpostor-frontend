import type { Player } from "../store/gameState";
import { DEFAULT_CANVAS_COLOR } from "./canvasColors";

const PLAYER_STYLES = [
  {
    icon: "bg-blue-500 text-white",
    active: "bg-blue-500/20 border border-blue-500/40",
    voting: "bg-blue-500/20 border border-blue-500/40",
    canvas: "#3b82f6",
  },
  {
    icon: "bg-emerald-500 text-white",
    active: "bg-emerald-500/20 border border-emerald-500/40",
    voting: "bg-emerald-500/20 border border-emerald-500/40",
    canvas: "#10b981",
  },
  {
    icon: "bg-violet-500 text-white",
    active: "bg-violet-500/20 border border-violet-500/40",
    voting: "bg-violet-500/20 border border-violet-500/40",
    canvas: "#8b5cf6",
  },
  {
    icon: "bg-rose-500 text-white",
    active: "bg-rose-500/20 border border-rose-500/40",
    voting: "bg-rose-500/20 border border-rose-500/40",
    canvas: "#f43f5e",
  },
  {
    icon: "bg-indigo-500 text-white",
    active: "bg-indigo-500/20 border border-indigo-500/40",
    voting: "bg-indigo-500/20 border border-indigo-500/40",
    canvas: "#6366f1",
  },
  {
    icon: "bg-cyan-700 text-white",
    active: "bg-cyan-700/20 border border-cyan-700/40",
    voting: "bg-cyan-700/20 border border-cyan-700/40",
    canvas: "#0e7490",
  },
  {
    icon: "bg-teal-700 text-white",
    active: "bg-teal-700/20 border border-teal-700/40",
    voting: "bg-teal-700/20 border border-teal-700/40",
    canvas: "#0f766e",
  },
  {
    icon: "bg-lime-700 text-white",
    active: "bg-lime-700/20 border border-lime-700/40",
    voting: "bg-lime-700/20 border border-lime-700/40",
    canvas: "#4d7c0f",
  },
  {
    icon: "bg-fuchsia-500 text-white",
    active: "bg-fuchsia-500/20 border border-fuchsia-500/40",
    voting: "bg-fuchsia-500/20 border border-fuchsia-500/40",
    canvas: "#d946ef",
  },
  {
    icon: "bg-sky-700 text-white",
    active: "bg-sky-700/20 border border-sky-700/40",
    voting: "bg-sky-700/20 border border-sky-700/40",
    canvas: "#0369a1",
  },
];

// Solid stand-in for the host's amber-to-orange gradient, which a canvas
// strokeStyle can't reproduce.
const HOST_CANVAS_COLOR = "#f97316";

const getPlayerStyle = (playerIndex: number) =>
  PLAYER_STYLES[playerIndex % PLAYER_STYLES.length];

export const getPlayerIconColorClass = (
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

  return getPlayerStyle(playerIndex).icon;
};

export const getActivePlayerCardColorClass = (
  playerId: string | null,
  hostId: string | null,
  players: Player[],
): string => {
  if (!playerId) return "bg-stone-800 border border-stone-700";

  if (playerId === hostId) {
    return "bg-orange-500/20 border border-orange-500/50";
  }

  // Find the index of the player in the list to assign a consistent color
  const playerIndex = players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1) return "bg-stone-800 border border-stone-700";

  return getPlayerStyle(playerIndex).active;
};

export const getPlayerVotingCardColorClass = (
  playerId: string | null,
  hostId: string | null,
  players: Player[],
): string => {
  if (!playerId) return "border border-stone-700 bg-stone-900";

  if (playerId === hostId) {
    return "bg-orange-500/20 border border-orange-500/50";
  }

  // Find the index of the player in the list to assign a consistent color
  const playerIndex = players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1) return "border border-stone-700 bg-stone-900";

  return getPlayerStyle(playerIndex).voting;
};

/**
 * Brush color for a player when the host disabled the canvas color palette.
 */
export const getPlayerCanvasColor = (
  playerId: string | null,
  hostId: string | null,
  players: Player[],
): string => {
  if (!playerId) return DEFAULT_CANVAS_COLOR;

  if (playerId === hostId) return HOST_CANVAS_COLOR;

  // Find the index of the player in the list to assign a consistent color
  const playerIndex = players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1) return DEFAULT_CANVAS_COLOR;

  return getPlayerStyle(playerIndex).canvas;
};
