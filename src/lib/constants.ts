import type { GameMode, GameOptions } from "../store/gameState";

export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 3;
export const DEFAULT_ROUND_TIME = 20;
export const MAX_INK = 1000;
export const DOT_INK_COST = 5;
// Guesses the impostor gets during DRAWING/VOTING (shared pool, persists across
// rounds). Configurable by the host between MIN and MAX, defaulting to DEFAULT.
export const MIN_IMPOSTOR_GUESSES = 1;
export const MAX_IMPOSTOR_GUESSES = 3;
export const DEFAULT_IMPOSTOR_GUESSES = 3;
// Word players write in CUSTOM_WORD mode. Must match the server-side bounds.
export const MIN_CUSTOM_WORD_LENGTH = 2;
export const MAX_CUSTOM_WORD_LENGTH = 40;

// Options a mode takes over: while it is selected the value is forced and the
// host cannot change it. Mirrors MODE_LOCKED_OPTIONS on the server, which is
// what actually enforces it.
export const MODE_LOCKED_OPTIONS: Record<GameMode, Partial<GameOptions>> = {
  CLASSIC: {},
  // The word is written by a player, so it could simply be handed to the impostor
  CUSTOM_WORD: { impostorGuessEnabled: false },
  // Every round has a new word, so keeping the previous drawing makes no sense
  HOT_WORD: { clearCanvasEachRound: true },
};
