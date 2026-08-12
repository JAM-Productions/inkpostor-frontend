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
export const DEFAULT_IMPOSTOR_GUESSES = 1;
export const MIN_IMPOSTORS = 1;
export const DEFAULT_IMPOSTOR_COUNT = 1;
export const REPEAT_IMPOSTOR_WEIGHT = 0.2;
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
  playerColorsEnabled: true,
  impostorCount: DEFAULT_IMPOSTOR_COUNT,
  revealImpostorTeammates: true,
  impostorGuessEnabled: true,
  impostorGuessAttempts: DEFAULT_IMPOSTOR_GUESSES,
  impostorLosesWhenOutOfGuesses: false,
  hideHint: false,
  turnOrderMode: DEFAULT_TURN_ORDER_MODE,
  preventRepeatImpostors: true,
};

// The guessing sub-option means nothing while the feature itself is off, so
// wherever guessing is turned off it goes back to default. Mirrors the server,
// which is what actually enforces it.
const GUESS_SUB_OPTION_DEFAULTS: Partial<GameOptions> = {
  impostorLosesWhenOutOfGuesses:
    DEFAULT_GAME_OPTIONS.impostorLosesWhenOutOfGuesses,
};

// Modes where players say their words out loud instead of drawing: the round
// runs ORDER_INFO -> VOTING and DRAWING is never reached. Mirrors the server's
// own predicate.
const SPOKEN_GAME_MODES: GameMode[] = ["ORIGINAL", "ORIGINAL_CHAOS"];
export const isSpokenMode = (mode: GameMode): boolean =>
  SPOKEN_GAME_MODES.includes(mode);

// Modes where the secret word is written by the players, so it opens on
// WORD_SELECTION and is never treated as a translation key.
const PLAYER_WORD_GAME_MODES: GameMode[] = ["CUSTOM_WORD", "ORIGINAL_CHAOS"];
export const isPlayerWordMode = (mode: GameMode): boolean =>
  PLAYER_WORD_GAME_MODES.includes(mode);

// Options a mode takes over: while it is selected the value is forced and the
// host cannot change it. Single source of truth for the lock, mirrored by the
// server.
//
// Nothing is drawn in a spoken mode, so every drawing option is forced to a
// neutral value instead of lingering as a setting the host cannot see.
const SPOKEN_MODE_LOCKS: Partial<GameOptions> = {
  roundTime: DEFAULT_ROUND_TIME,
  unlimitedInk: false,
  clearCanvasEachRound: true,
  playerColorsEnabled: false,
  impostorGuessEnabled: false,
  impostorGuessAttempts: DEFAULT_IMPOSTOR_GUESSES,
  ...GUESS_SUB_OPTION_DEFAULTS,
};

export const MODE_LOCKED_OPTIONS: Record<GameMode, Partial<GameOptions>> = {
  CLASSIC: {},
  // The word is written by a player, so it could simply be handed to the impostor.
  CUSTOM_WORD: {
    impostorGuessEnabled: false,
    ...GUESS_SUB_OPTION_DEFAULTS,
  },
  // Every round has a new word, so keeping the previous drawing makes no sense.
  HOT_WORD: { clearCanvasEachRound: true },
  ORIGINAL: SPOKEN_MODE_LOCKS,
  ORIGINAL_CHAOS: SPOKEN_MODE_LOCKS,
};

// What a fresh room plays, and what the options modal resets back to.
export const DEFAULT_GAME_MODE: GameMode = "CLASSIC";

// Layers a mode's locks on top of the host's own choices. The server does the
// same thing on every save, so this is what the host's settings will become
// while that mode is selected.
export const applyModeLockedOptions = (
  options: GameOptions,
  gameMode: GameMode,
): GameOptions => ({ ...options, ...MODE_LOCKED_OPTIONS[gameMode] });

// Which option sections the modal renders for each mode. Different from
// MODE_LOCKED_OPTIONS, which forces a value and shows it with a padlock: a
// section missing here doesn't exist for that mode at all.
export type OptionSection =
  | "time"
  | "unlimitedInk"
  | "playerColors"
  | "clearCanvas"
  | "impostorCount"
  | "impostorGuess"
  | "hideHint"
  | "turnOrder";

export const DRAWING_OPTION_SECTIONS: OptionSection[] = [
  "impostorCount",
  "time",
  "unlimitedInk",
  "playerColors",
  "clearCanvas",
  "impostorGuess",
  "hideHint",
];

// Nothing is drawn: the drawing options are replaced, not just locked
const SPOKEN_OPTION_SECTIONS: OptionSection[] = [
  "impostorCount",
  "turnOrder",
  "hideHint",
];

// The options each section owns. Lets a caller go from "what this mode shows"
// to "which options it can change" — the lobby counts the non-default ones from
// this, so an option that isn't on screen never shows up in that count.
export const SECTION_OPTION_KEYS: Record<OptionSection, (keyof GameOptions)[]> =
  {
    impostorCount: [
      "impostorCount",
      "revealImpostorTeammates",
      "preventRepeatImpostors",
    ],
    time: ["roundTime"],
    unlimitedInk: ["unlimitedInk"],
    playerColors: ["playerColorsEnabled"],
    clearCanvas: ["clearCanvasEachRound"],
    impostorGuess: [
      "impostorGuessEnabled",
      "impostorGuessAttempts",
      "impostorLosesWhenOutOfGuesses",
    ],
    hideHint: ["hideHint"],
    turnOrder: ["turnOrderMode"],
  };

export const MODE_OPTION_SECTIONS: Record<GameMode, OptionSection[]> = {
  CLASSIC: DRAWING_OPTION_SECTIONS,
  CUSTOM_WORD: DRAWING_OPTION_SECTIONS,
  HOT_WORD: DRAWING_OPTION_SECTIONS,
  ORIGINAL: SPOKEN_OPTION_SECTIONS,
  ORIGINAL_CHAOS: SPOKEN_OPTION_SECTIONS,
};
