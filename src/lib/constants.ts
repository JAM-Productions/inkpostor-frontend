import type { GameMode, GameOptions, TurnOrderMode } from "../store/gameState";

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

// Order the players speak in, in ORIGINAL mode.
export const TURN_ORDER_MODES: TurnOrderMode[] = [
  "RANDOM_STARTER",
  "FIXED_ORDER",
  "RANDOM_ORDER",
];
export const DEFAULT_TURN_ORDER_MODE: TurnOrderMode = "RANDOM_STARTER";
// The two modes that hand out the whole order instead of just the starter.
export const FULL_ORDER_MODES: TurnOrderMode[] = [
  "FIXED_ORDER",
  "RANDOM_ORDER",
];

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  roundTime: DEFAULT_ROUND_TIME,
  unlimitedInk: false,
  clearCanvasEachRound: true,
  playerColorsEnabled: false,
  impostorGuessEnabled: false,
  impostorGuessAttempts: DEFAULT_IMPOSTOR_GUESSES,
  hideHint: false,
  turnOrderMode: DEFAULT_TURN_ORDER_MODE,
};

// Modes where players say their words out loud instead of drawing: the round
// runs ORDER_INFO -> VOTING and DRAWING is never reached. Mirrors the server's
// own predicate.
const SPOKEN_GAME_MODES: GameMode[] = ["ORIGINAL", "ORIGINAL_CHAOS"];
export const isSpokenMode = (mode: GameMode): boolean =>
  SPOKEN_GAME_MODES.includes(mode);

// Nothing is drawn in a spoken mode, so every drawing option goes back to
// default instead of lingering as a setting the host cannot see.
const SPOKEN_MODE_LOCKS: Partial<GameOptions> = {
  roundTime: DEFAULT_ROUND_TIME,
  unlimitedInk: false,
  clearCanvasEachRound: true,
  playerColorsEnabled: false,
  impostorGuessEnabled: false,
  impostorGuessAttempts: DEFAULT_IMPOSTOR_GUESSES,
};

// Options a mode takes over: while it is selected the value is forced and the
// host cannot change it. Mirrors MODE_LOCKED_OPTIONS on the server, which is
// what actually enforces it.
export const MODE_LOCKED_OPTIONS: Record<GameMode, Partial<GameOptions>> = {
  CLASSIC: { hideHint: false },
  // The word is written by a player, so it could simply be handed to the impostor
  CUSTOM_WORD: { impostorGuessEnabled: false, hideHint: false },
  // Every round has a new word, so keeping the previous drawing makes no sense
  HOT_WORD: { clearCanvasEachRound: true, hideHint: false },
  ORIGINAL: SPOKEN_MODE_LOCKS,
  ORIGINAL_CHAOS: SPOKEN_MODE_LOCKS,
};

// Which option sections the modal renders for each mode. Different from
// MODE_LOCKED_OPTIONS, which forces a value and shows it with a padlock: a
// section missing here doesn't exist for that mode at all.
export type OptionSection =
  | "time"
  | "unlimitedInk"
  | "playerColors"
  | "clearCanvas"
  | "impostorGuess"
  | "hideHint"
  | "turnOrder";

export const DRAWING_OPTION_SECTIONS: OptionSection[] = [
  "time",
  "unlimitedInk",
  "playerColors",
  "clearCanvas",
  "impostorGuess",
];

// Nothing is drawn: the drawing options are replaced, not just locked
const SPOKEN_OPTION_SECTIONS: OptionSection[] = ["hideHint", "turnOrder"];

export const MODE_OPTION_SECTIONS: Record<GameMode, OptionSection[]> = {
  CLASSIC: DRAWING_OPTION_SECTIONS,
  CUSTOM_WORD: DRAWING_OPTION_SECTIONS,
  HOT_WORD: DRAWING_OPTION_SECTIONS,
  ORIGINAL: SPOKEN_OPTION_SECTIONS,
  ORIGINAL_CHAOS: SPOKEN_OPTION_SECTIONS,
};
