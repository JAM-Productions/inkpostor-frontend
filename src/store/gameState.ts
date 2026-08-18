import { create } from "zustand";
import type { Socket } from "socket.io-client";
import { SERVICE_URL } from "../config";
import i18n from "../i18n";
import { applyModeLockedOptions, DEFAULT_GAME_OPTIONS } from "../lib/constants";
import {
  detectIsMobile,
  getSavedPlayerName,
  savePlayerName,
  getOrCreateUserId,
  clearRoomUrlParam,
  patchMyPlayer,
  keepIfEqual,
} from "../lib/gameStateUtils";

export type GamePhase =
  | "LOBBY"
  | "WORD_SELECTION"
  | "ROLE_REVEAL"
  | "WORD_REVEAL"
  | "ORDER_INFO"
  | "DRAWING"
  | "VOTING"
  | "IMPOSTOR_GUESS"
  | "RESULTS";

export type GameMode =
  | "CLASSIC"
  | "CUSTOM_WORD"
  | "HOT_WORD"
  | "ORIGINAL"
  | "ORIGINAL_CHAOS";

export type TurnOrderMode = "RANDOM_STARTER" | "FIXED_ORDER" | "RANDOM_ORDER";

export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
  score: number;
  hasVoted?: boolean;
  isEjected?: boolean;
  hasRevealedRole?: boolean;
  hasConfirmedNewRound?: boolean;
  isSuspected?: boolean;
  hasStartedEmergencyVoting: boolean;
  hasSubmittedWord?: boolean;
  hasRevealedNewWord?: boolean;
  hasConfirmedOrder?: boolean;
}

export interface StrokeData {
  x: number;
  y: number;
  color: string;
  isNewStroke: boolean; // True if it's the first point of a line
}

export interface GameOptions {
  roundTime: number;
  unlimitedInk: boolean;
  clearCanvasEachRound: boolean;
  playerColorsEnabled: boolean;
  impostorCount: number;
  revealImpostorTeammates: boolean;
  impostorGuessEnabled: boolean;
  impostorGuessAttempts: number;
  // Sub-option of impostorGuessEnabled: spending the whole guess pool ends the
  // game right there with the impostor defeated.
  impostorLosesWhenOutOfGuesses: boolean;
  hideHint: boolean; // Keeps the category from the impostor
  turnOrderMode: TurnOrderMode;
  preventRepeatImpostors: boolean;
  // Spoken modes only: whether the app runs the VOTING phase at all. Off by
  // default — the table votes out loud and the host reveals the impostors from
  // ORDER_INFO, so the voting screen is never reached.
  virtualVotingEnabled: boolean;
}

export interface GameState {
  roomId: string | null;
  hostId: string | null;
  isMobile: boolean;
  phase: GamePhase;
  // What the game runs on: the host's choices with the current mode's locks
  // applied on top (see MODE_LOCKED_OPTIONS).
  gameOptions: GameOptions;
  // What the host chose, before those locks. The options modal edits these, so
  // a detour through a mode that takes an option over doesn't lose the value.
  hostGameOptions: GameOptions;
  // Selected game mode for the room. In the OptionsModal it is staged until saved
  // (see actions.updateGameOptions) rather than applied immediately on carousel change.
  gameMode: GameMode;
  players: Player[];
  impostorId: string | null; // Only available in RESULTS or to the impostor themselves locally
  impostorIds: string[];
  secretWord: string | null; // Only available to non-impostors
  secretCategory: string | null;
  currentTurnPlayerId: string | null;
  turnOrder: string[];
  turnIndex: number;
  votes: Record<string, string>;
  kickVotes: Record<string, string[]>;
  canvasStrokes: StrokeData[];
  // Which wipe of the canvas the local strokes belong to. The server no longer
  // sends the drawing with every state update, so this is how a client learns
  // its canvas was cleared (see `resolveCanvasStrokes`).
  canvasEpoch: number;
  currentRound: number;
  ejectedId: string | null;
  gameEnded: boolean;
  endedByHost: boolean;
  kickedOutPlayers: { id: string; name: string }[];
  ejectedWasImpostor?: boolean | null;
  remainingImpostorCount?: number | null;
  impostorGuessesUsed: number;
  impostorGuessedCorrectly: boolean;
  guessingImpostorId: string | null;
  impostorOutOfGuesses: boolean;

  // Local only state
  myId: string | null;
  myName: string | null;
  amIImpostor: boolean | null;
  impostorTeammates: string[];
  errorMessage: string | null;

  // Actions mapped to Socket
  actions: {
    connectAndJoin: (roomId: string, playerName: string) => void;
    connectAndCreate: (roomId: string, playerName: string) => void;
    kickPlayer: (playerId: string) => void;
    voteKickPlayer: (targetId: string) => void;
    startGame: () => void;
    submitCustomWord: (word: string) => void;
    proceedToDrawing: () => void;
    confirmNewWord: () => void;
    confirmOrder: () => void;
    revealResults: () => void;
    // Takes a whole frame's worth of points, or a single one.
    drawStroke: (stroke: StrokeData | StrokeData[]) => void;
    undoStroke: () => void;
    endTurn: () => void;
    vote: (votedForId: string) => void;
    playAgain: () => void;
    nextRound: () => void;
    endGame: () => void;
    startEmergencyVoting: () => void;
    submitImpostorGuess: (guess: string, language: string) => void;
    skipImpostorGuess: () => void;
    // The game mode is staged in the options modal like everything else, so it
    // is saved together with them rather than applied on its own.
    updateGameOptions: (options: GameOptions & { gameMode: GameMode }) => void;
    setError: (msg: string | null) => void;
    toggleSus: (playerId: string) => void;
    exitGame: () => void;
  };
}

// socket.io-client is a sixth of the initial bundle and nothing needs it until a
// player actually enters a room, so it is fetched on the way in rather than up
// front. App warms the chunk shortly after first paint, so the click that joins
// a room does not end up waiting on the network.
let socketRef: Socket | null = null;
let socketLoading: Promise<Socket> | null = null;

export function loadSocket(): Promise<Socket> {
  if (!socketLoading) {
    socketLoading = import("../socket").then(({ socket }) => {
      socketRef = socket;
      // Registered before anything connects, so no event can arrive unheard.
      registerSocketListeners(socket);
      return socket;
    });
  }
  return socketLoading;
}

// Every action that talks to the server goes through here. Before a player has
// joined there is nothing to talk to, and nothing worth saying.
function emit(event: string, ...args: unknown[]): void {
  socketRef?.emit(event, ...args);
}

export const useGameStore = create<GameState>()((set, get) => ({
  roomId: null,
  hostId: null,
  isMobile: detectIsMobile(),
  phase: "LOBBY",
  gameOptions: { ...DEFAULT_GAME_OPTIONS },
  hostGameOptions: { ...DEFAULT_GAME_OPTIONS },
  gameMode: "CLASSIC",
  players: [],
  impostorId: null,
  impostorIds: [],
  impostorTeammates: [],
  secretWord: null,
  secretCategory: null,
  currentTurnPlayerId: null,
  turnOrder: [],
  turnIndex: 0,
  votes: {},
  kickVotes: {},
  canvasStrokes: [],
  canvasEpoch: 0,
  currentRound: 1,
  ejectedId: null,
  gameEnded: false,
  endedByHost: false,
  kickedOutPlayers: [],
  ejectedWasImpostor: null,
  remainingImpostorCount: null,
  impostorGuessesUsed: 0,
  impostorGuessedCorrectly: false,
  guessingImpostorId: null,
  impostorOutOfGuesses: false,
  myId: null,
  myName: getSavedPlayerName(),
  amIImpostor: null,
  errorMessage: null,

  actions: {
    connectAndCreate: async (roomId, playerName) => {
      try {
        const userId = getOrCreateUserId();
        const res = await fetch(`${SERVICE_URL || ""}/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: playerName, userId }),
        });
        if (!res.ok) {
          const data = await res.json();
          set({ errorMessage: data.message || "Authentication failed" });
          return;
        }
        const { token } = await res.json();
        const socket = await loadSocket();
        socket.auth = { token };
        socket.io.reconnection(true); // re-enable in case it was disabled after a kick
        socket.connect();
        socket.emit("createRoom", { roomId, language: i18n.language });
        savePlayerName(playerName);
        set({ myName: playerName, myId: userId });
      } catch {
        set({ errorMessage: "Service connection error." });
      }
    },
    connectAndJoin: async (roomId, playerName) => {
      try {
        const userId = getOrCreateUserId();
        const res = await fetch(`${SERVICE_URL || ""}/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: playerName, userId }),
        });
        if (!res.ok) {
          const data = await res.json();
          set({ errorMessage: data.message || "Authentication failed" });
          return;
        }
        const { token } = await res.json();
        const socket = await loadSocket();
        socket.auth = { token };
        socket.io.reconnection(true); // re-enable in case it was disabled after a kick
        socket.connect();
        socket.emit("joinRoom", { roomId, language: i18n.language });
        savePlayerName(playerName);
        set({ myName: playerName, myId: userId });
      } catch {
        set({ errorMessage: "Service connection error." });
      }
    },
    kickPlayer: (playerId) => {
      emit("kickPlayer", { playerId });
    },
    voteKickPlayer: (targetId) => {
      emit("voteKickPlayer", { targetId });
    },
    startGame: () => {
      emit("startGame");
    },
    submitCustomWord: (word) => {
      const trimmed = word.trim();
      if (!trimmed) return;
      emit("submitCustomWord", { word: trimmed });
      // Optimistic update to prevent multiple submissions
      set((state) => patchMyPlayer(state, { hasSubmittedWord: true }));
    },
    proceedToDrawing: () => {
      emit("proceedToDrawing");
      // Optimistic update for better performance and deny multiple clicks to proceed
      set((state) => patchMyPlayer(state, { hasRevealedRole: true }));
    },
    confirmNewWord: () => {
      emit("confirmNewWord");
      // Optimistic update to prevent multiple clicks to proceed
      set((state) => patchMyPlayer(state, { hasRevealedNewWord: true }));
    },
    confirmOrder: () => {
      emit("confirmOrder");
      // Optimistic update to prevent multiple clicks to proceed
      set((state) => patchMyPlayer(state, { hasConfirmedOrder: true }));
    },
    revealResults: () => {
      emit("revealResults");
    },
    drawStroke: (stroke) => {
      const points = Array.isArray(stroke) ? stroke : [stroke];
      if (points.length === 0) return;
      emit("drawStroke", stroke);
      set((state) => ({ canvasStrokes: [...state.canvasStrokes, ...points] }));
    },
    undoStroke: () => {
      emit("undoStroke");
    },
    endTurn: () => {
      emit("endTurn");
    },
    vote: (votedForId) => {
      const currentState = get();
      if (!currentState.myId) return;

      const me = currentState.players.find((p) => p.id === currentState.myId);
      if (!me || me.hasVoted || me.isEjected) return;

      emit("vote", votedForId);
      // Optimistic update for better performance and feedback
      set((state) => ({
        ...patchMyPlayer(state, { hasVoted: true }),
        votes: { ...state.votes, [state.myId!]: votedForId },
      }));
    },
    playAgain: () => {
      emit("playAgain");
    },
    nextRound: () => {
      emit("nextRound");
      // Optimistic update for better performance and to prevent multiple clicks to proceed
      set((state) => patchMyPlayer(state, { hasConfirmedNewRound: true }));
    },
    endGame: () => {
      emit("endGame");
    },
    startEmergencyVoting: () => {
      const currentState = get();
      if (!currentState.myId) return;
      const me = currentState.players.find((p) => p.id === currentState.myId);
      if (!me || me.hasStartedEmergencyVoting || me.isEjected) return;
      emit("startEmergencyVoting");
      // Optimistic update for better performance and to prevent multiple clicks to alert
      set((state) => patchMyPlayer(state, { hasStartedEmergencyVoting: true }));
    },
    submitImpostorGuess: (guess, language) => {
      const trimmed = guess.trim();
      if (!trimmed) return;
      emit("submitImpostorGuess", { guess: trimmed, language });
    },
    skipImpostorGuess: () => {
      emit("skipImpostorGuess");
    },
    updateGameOptions: ({ gameMode, ...options }) => {
      emit("updateGameOptions", { gameMode, ...options });
      // Optimistic update for better performance. The mode rides along in the
      // same payload but lives outside gameOptions on the room. What travels is
      // what the host chose; the mode's locks are layered on top for the values
      // the game actually runs on, exactly as the server does it.
      set((state) => {
        const hostGameOptions = { ...state.hostGameOptions, ...options };
        return {
          gameMode,
          hostGameOptions,
          gameOptions: applyModeLockedOptions(hostGameOptions, gameMode),
        };
      });
    },
    setError: (msg) => {
      set({ errorMessage: msg });
    },
    toggleSus: (playerId) => {
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId && !p.isEjected
            ? { ...p, isSuspected: !p.isSuspected }
            : p,
        ),
      }));
    },
    exitGame: () => {
      clearRoomUrlParam();
      socketRef?.disconnect();
      socketRef?.io.reconnection(false);
      set({
        roomId: null,
        hostId: null,
        phase: "LOBBY",
        gameMode: "CLASSIC",
        players: [],
        impostorId: null,
        secretWord: null,
        secretCategory: null,
        currentTurnPlayerId: null,
        turnOrder: [],
        turnIndex: 0,
        votes: {},
        kickVotes: {},
        canvasStrokes: [],
        canvasEpoch: 0,
        currentRound: 1,
        ejectedId: null,
        gameEnded: false,
        endedByHost: false,
        kickedOutPlayers: [],
        impostorGuessesUsed: 0,
        impostorGuessedCorrectly: false,
        guessingImpostorId: null,
        impostorOutOfGuesses: false,
        gameOptions: { ...DEFAULT_GAME_OPTIONS },
        hostGameOptions: { ...DEFAULT_GAME_OPTIONS },
        amIImpostor: null,
        errorMessage: null,
      });
    },
  },
}));

// Setup socket listeners
/**
 * Works out what the canvas should hold after a state update.
 *
 * The drawing used to ride along with every update, which meant one `endTurn` in
 * a full room re-sent it once per player. It now arrives point by point through
 * `strokeUpdate` and in full through `canvasSync`; an update only carries the
 * epoch and the stroke count, which is enough to notice the two things a client
 * cannot derive on its own: that the canvas was wiped, and that it fell behind.
 */
function resolveCanvasStrokes(
  prevState: GameState,
  newState: {
    canvasStrokes?: StrokeData[];
    canvasEpoch?: number;
    canvasStrokeCount?: number;
  },
): StrokeData[] {
  // A server that predates this still sends the whole drawing inline.
  if (Array.isArray(newState.canvasStrokes)) return newState.canvasStrokes;

  const epoch =
    typeof newState.canvasEpoch === "number" ? newState.canvasEpoch : null;
  const count =
    typeof newState.canvasStrokeCount === "number"
      ? newState.canvasStrokeCount
      : null;
  // Joining a room already gets a `canvasSync` of its own, so a mismatch on the
  // very first update is expected rather than a sign of trouble.
  const established = !!prevState.roomId;

  if (epoch !== null && epoch !== prevState.canvasEpoch) {
    // The canvas was wiped. If points have been drawn since, this client never
    // saw the wipe land, so the drawing is pulled rather than guessed at.
    if (established && count) emit("requestCanvasSync");
    return [];
  }

  // Holding fewer points than the server means a `strokeUpdate` went missing.
  // Holding more is just this client's own optimistic append, still in flight.
  if (established && count !== null && count > prevState.canvasStrokes.length) {
    emit("requestCanvasSync");
  }

  return prevState.canvasStrokes;
}

/**
 * Wires the store to a socket. Called once, by `loadSocket`, before anything
 * connects — so nothing can arrive before there is a handler for it.
 */
function registerSocketListeners(socket: Socket) {
  socket.on("connect", () => {
    const state = useGameStore.getState();

    // Restore (or create) the persistent UUID identity using the shared helper
    const userId = getOrCreateUserId();
    useGameStore.setState({ myId: userId });

    // Auto-reconnect logic: if the socket dropped mid-game, rejoin the room
    if (state.roomId && state.myName) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Reconnecting to room:", state.roomId);
      }
      socket.emit("joinRoom", {
        roomId: state.roomId,
        language: i18n.language,
      });
    }
  });

  socket.on("gameStateUpdate", (newState) => {
    if (!socket.connected) return;

    const prevState = useGameStore.getState();

    if (
      prevState.roomId &&
      newState.roomId &&
      newState.roomId !== prevState.roomId
    ) {
      return;
    }

    const nextPlayers = newState.players.map((p: any) => {
      const prevPlayer = prevState.players.find((pp) => pp.id === p.id);
      const isNewGamePhase =
        newState.phase === "LOBBY" ||
        newState.phase === "WORD_SELECTION" ||
        newState.phase === "ROLE_REVEAL";
      return {
        ...p,
        isSuspected:
          isNewGamePhase || p.isEjected ? false : prevPlayer?.isSuspected,
      };
    });

    // Sync all service-provided state that exists on client state.
    //
    // The collections go through `keepIfEqual`: an update rebuilds every field it
    // carries, so without it a vote by one player re-renders every component
    // watching `players` or `gameOptions`, whose contents did not change at all.
    useGameStore.setState({
      roomId: newState.roomId,
      hostId: newState.hostId,
      phase: newState.phase,
      players: keepIfEqual(prevState.players, nextPlayers),
      impostorId: newState.impostorId ?? newState.impostorIds?.[0] ?? null,
      impostorIds:
        newState.impostorIds ??
        (newState.impostorId ? [newState.impostorId] : []),
      // WORD_SELECTION resets alongside LOBBY: the word of the previous game must
      // not linger while the players are writing the new one.
      secretWord:
        newState.phase === "LOBBY" || newState.phase === "WORD_SELECTION"
          ? null
          : newState.secretWord !== null
            ? newState.secretWord
            : prevState.secretWord,
      secretCategory:
        newState.phase === "LOBBY" || newState.phase === "WORD_SELECTION"
          ? null
          : newState.secretCategory !== null
            ? newState.secretCategory
            : prevState.secretCategory,
      currentTurnPlayerId: newState.currentTurnPlayerId,
      turnOrder: keepIfEqual(prevState.turnOrder, newState.turnOrder),
      turnIndex: newState.turnIndex,
      votes: keepIfEqual(prevState.votes, newState.votes),
      kickVotes: keepIfEqual(prevState.kickVotes, newState.kickVotes || {}),
      canvasStrokes: resolveCanvasStrokes(prevState, newState),
      canvasEpoch: newState.canvasEpoch ?? prevState.canvasEpoch,
      currentRound: newState.currentRound,
      ejectedId: newState.ejectedId,
      gameEnded: newState.gameEnded,
      endedByHost: newState.endedByHost ?? false,
      kickedOutPlayers: newState.kickedOutPlayers ?? [],
      ejectedWasImpostor: newState.ejectedWasImpostor ?? null,
      remainingImpostorCount: newState.remainingImpostorCount ?? null,
      gameOptions: keepIfEqual(prevState.gameOptions, newState.gameOptions),
      // A server that doesn't split them yet reports only the effective ones
      hostGameOptions: keepIfEqual(
        prevState.hostGameOptions,
        newState.hostGameOptions ?? newState.gameOptions,
      ),
      gameMode: newState.gameMode ?? "CLASSIC",
      impostorGuessesUsed: newState.impostorGuessesUsed ?? 0,
      impostorGuessedCorrectly: newState.impostorGuessedCorrectly ?? false,
      guessingImpostorId: newState.guessingImpostorId ?? null,
      impostorOutOfGuesses: newState.impostorOutOfGuesses ?? false,
    });
  });

  socket.on(
    "roleAssignment",
    (roles: {
      isImpostor: boolean;
      impostorTeammates?: string[];
      secretWord: string | null;
      secretCategory: string | null;
    }) => {
      if (!socket.connected) return;
      useGameStore.setState({
        amIImpostor: roles.isImpostor,
        impostorTeammates: roles.impostorTeammates || [],
        secretWord: roles.secretWord,
        secretCategory: roles.secretCategory,
      });
    },
  );

  // A current client sends a frame's worth of points at a time; an older one sends
  // them one by one, and the server forwards whichever shape it received.
  socket.on("strokeUpdate", (stroke: StrokeData | StrokeData[]) => {
    if (!socket.connected) return;
    const points = Array.isArray(stroke) ? stroke : [stroke];
    if (points.length === 0) return;
    useGameStore.setState((state) => ({
      canvasStrokes: [...state.canvasStrokes, ...points],
    }));
  });

  // The whole drawing, sent on joining a room and whenever this client works out
  // it has fallen behind. The only message that carries it.
  socket.on(
    "canvasSync",
    (payload: { epoch?: number; strokes?: StrokeData[] }) => {
      if (!socket.connected) return;
      useGameStore.setState({
        canvasEpoch: typeof payload?.epoch === "number" ? payload.epoch : 0,
        canvasStrokes: Array.isArray(payload?.strokes) ? payload.strokes : [],
      });
    },
  );

  socket.on("strokeUndone", () => {
    if (!socket.connected) return;
    useGameStore.setState((state) => {
      if (state.canvasStrokes.length === 0) return state;

      let lastNewStrokeIndex = state.canvasStrokes.length - 1;
      while (
        lastNewStrokeIndex >= 0 &&
        !state.canvasStrokes[lastNewStrokeIndex].isNewStroke
      ) {
        lastNewStrokeIndex--;
      }

      if (lastNewStrokeIndex >= 0) {
        return {
          canvasStrokes: state.canvasStrokes.slice(0, lastNewStrokeIndex),
        };
      } else {
        return { canvasStrokes: [] };
      }
    });
  });

  socket.on("kicked", (msg: string) => {
    clearRoomUrlParam();
    useGameStore.setState((state) => ({
      roomId: null,
      hostId: null,
      phase: "LOBBY",
      gameOptions: DEFAULT_GAME_OPTIONS,
      hostGameOptions: DEFAULT_GAME_OPTIONS,
      gameMode: "CLASSIC",
      players: [],
      impostorId: null,
      secretWord: null,
      secretCategory: null,
      currentTurnPlayerId: null,
      turnOrder: [],
      turnIndex: 0,
      votes: {},
      kickVotes: {},
      canvasStrokes: [],
      canvasEpoch: 0,
      currentRound: 1,
      ejectedId: null,
      gameEnded: false,
      endedByHost: false,
      kickedOutPlayers: [],
      impostorGuessesUsed: 0,
      impostorGuessedCorrectly: false,
      guessingImpostorId: null,
      impostorOutOfGuesses: false,
      amIImpostor: null,
      errorMessage: msg,
      myName: state.myName,
      myId: state.myId,
      isMobile: state.isMobile,
      actions: state.actions,
    }));
    // Disable auto-reconnect before disconnecting so Socket.io doesn't fire
    // a 'connect' event before this 'kicked' handler finishes clearing state,
    // which would cause the player to rejoin with a stale roomId (the flicker bug).
    socket.io.reconnection(false);
    socket.disconnect();
  });

  socket.on("error", (msg: string) => {
    useGameStore.setState({ errorMessage: msg });
    socket.disconnect();
  });

  i18n.on("languageChanged", (lng) => {
    if (socket.connected) {
      socket.emit("setLanguage", { language: lng });
    }
  });
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).__GAME_STORE__ = useGameStore;
}
