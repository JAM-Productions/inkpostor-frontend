import { create } from "zustand";
import { socket, SERVICE_URL } from "../socket";
import i18n from "../i18n";
import { DEFAULT_ROUND_TIME, DEFAULT_IMPOSTOR_GUESSES } from "../lib/constants";
import {
  detectIsMobile,
  getSavedPlayerName,
  savePlayerName,
  getOrCreateUserId,
  clearRoomUrlParam,
  patchMyPlayer,
} from "../lib/gameStateUtils";

export type GamePhase =
  | "LOBBY"
  | "ROLE_REVEAL"
  | "DRAWING"
  | "VOTING"
  | "IMPOSTOR_GUESS"
  | "RESULTS";

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
  impostorGuessEnabled: boolean;
  impostorGuessAttempts: number;
}

export interface GameState {
  roomId: string | null;
  hostId: string | null;
  isMobile: boolean;
  phase: GamePhase;
  gameOptions: GameOptions;
  players: Player[];
  impostorId: string | null; // Only available in RESULTS or to the impostor themselves locally
  secretWord: string | null; // Only available to non-impostors
  secretCategory: string | null;
  currentTurnPlayerId: string | null;
  turnOrder: string[];
  turnIndex: number;
  votes: Record<string, string>;
  kickVotes: Record<string, string[]>;
  canvasStrokes: StrokeData[];
  currentRound: number;
  ejectedId: string | null;
  gameEnded: boolean;

  // Impostor guess feature
  impostorGuessesUsed: number;
  impostorGuessedCorrectly: boolean;

  // Local only state
  myId: string | null;
  myName: string | null;
  amIImpostor: boolean | null;
  errorMessage: string | null;

  // Actions mapped to Socket
  actions: {
    connectAndJoin: (roomId: string, playerName: string) => void;
    connectAndCreate: (roomId: string, playerName: string) => void;
    kickPlayer: (playerId: string) => void;
    voteKickPlayer: (targetId: string) => void;
    startGame: () => void;
    proceedToDrawing: () => void;
    drawStroke: (stroke: StrokeData) => void;
    undoStroke: () => void;
    endTurn: () => void;
    vote: (votedForId: string) => void;
    playAgain: () => void;
    nextRound: () => void;
    endGame: () => void;
    startEmergencyVoting: () => void;
    submitImpostorGuess: (guess: string, language: string) => void;
    skipImpostorGuess: () => void;
    updateGameOptions: (options: GameOptions) => void;
    setError: (msg: string | null) => void;
    toggleSus: (playerId: string) => void;
    exitGame: () => void;
  };
}

export const useGameStore = create<GameState>()((set, get) => ({
  roomId: null,
  hostId: null,
  isMobile: detectIsMobile(),
  phase: "LOBBY",
  gameOptions: {
    roundTime: DEFAULT_ROUND_TIME,
    unlimitedInk: false,
    clearCanvasEachRound: true,
    impostorGuessEnabled: false,
    impostorGuessAttempts: DEFAULT_IMPOSTOR_GUESSES,
  },
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
  currentRound: 1,
  ejectedId: null,
  gameEnded: false,
  impostorGuessesUsed: 0,
  impostorGuessedCorrectly: false,
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
      socket.emit("kickPlayer", { playerId });
    },
    voteKickPlayer: (targetId) => {
      socket.emit("voteKickPlayer", { targetId });
    },
    startGame: () => {
      socket.emit("startGame");
    },
    proceedToDrawing: () => {
      socket.emit("proceedToDrawing");
      // Optimistic update for better performance and deny multiple clicks to proceed
      set((state) => patchMyPlayer(state, { hasRevealedRole: true }));
    },
    drawStroke: (stroke) => {
      socket.emit("drawStroke", stroke);
      set((state) => ({ canvasStrokes: [...state.canvasStrokes, stroke] }));
    },
    undoStroke: () => {
      socket.emit("undoStroke");
    },
    endTurn: () => {
      socket.emit("endTurn");
    },
    vote: (votedForId) => {
      const currentState = get();
      if (!currentState.myId) return;

      const me = currentState.players.find((p) => p.id === currentState.myId);
      if (!me || me.hasVoted || me.isEjected) return;

      socket.emit("vote", votedForId);
      // Optimistic update for better performance and feedback
      set((state) => ({
        ...patchMyPlayer(state, { hasVoted: true }),
        votes: { ...state.votes, [state.myId!]: votedForId },
      }));
    },
    playAgain: () => {
      socket.emit("playAgain");
    },
    nextRound: () => {
      socket.emit("nextRound");
      // Optimistic update for better performance and to prevent multiple clicks to proceed
      set((state) => patchMyPlayer(state, { hasConfirmedNewRound: true }));
    },
    endGame: () => {
      socket.emit("endGame");
    },
    startEmergencyVoting: () => {
      const currentState = get();
      if (!currentState.myId) return;
      const me = currentState.players.find((p) => p.id === currentState.myId);
      if (!me || me.hasStartedEmergencyVoting || me.isEjected) return;
      socket.emit("startEmergencyVoting");
      // Optimistic update for better performance and to prevent multiple clicks to alert
      set((state) => patchMyPlayer(state, { hasStartedEmergencyVoting: true }));
    },
    submitImpostorGuess: (guess, language) => {
      const trimmed = guess.trim();
      if (!trimmed) return;
      socket.emit("submitImpostorGuess", { guess: trimmed, language });
    },
    skipImpostorGuess: () => {
      socket.emit("skipImpostorGuess");
    },
    updateGameOptions: (options) => {
      socket.emit("updateGameOptions", options);
      // Optimistic update for better performance
      set((state) => ({
        gameOptions: { ...state.gameOptions, ...options },
      }));
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
      socket.disconnect();
      socket.io.reconnection(false);
      set({
        roomId: null,
        hostId: null,
        phase: "LOBBY",
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
        currentRound: 1,
        ejectedId: null,
        gameEnded: false,
        impostorGuessesUsed: 0,
        impostorGuessedCorrectly: false,
        amIImpostor: null,
        errorMessage: null,
      });
    },
  },
}));

// Setup socket listeners
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
    socket.emit("joinRoom", { roomId: state.roomId, language: i18n.language });
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

  // Sync all service-provided state that exists on client state
  useGameStore.setState({
    roomId: newState.roomId,
    hostId: newState.hostId,
    phase: newState.phase,
    players: newState.players.map((p: any) => {
      const prevPlayer = prevState.players.find((pp) => pp.id === p.id);
      const isNewGamePhase =
        newState.phase === "LOBBY" || newState.phase === "ROLE_REVEAL";
      return {
        ...p,
        isSuspected:
          isNewGamePhase || p.isEjected ? false : prevPlayer?.isSuspected,
      };
    }),
    impostorId: newState.impostorId,
    secretWord:
      newState.phase === "LOBBY"
        ? null
        : newState.secretWord !== null
          ? newState.secretWord
          : prevState.secretWord,
    secretCategory:
      newState.phase === "LOBBY"
        ? null
        : newState.secretCategory !== null
          ? newState.secretCategory
          : prevState.secretCategory,
    currentTurnPlayerId: newState.currentTurnPlayerId,
    turnOrder: newState.turnOrder,
    turnIndex: newState.turnIndex,
    votes: newState.votes,
    kickVotes: newState.kickVotes || {},
    canvasStrokes: newState.canvasStrokes,
    currentRound: newState.currentRound,
    ejectedId: newState.ejectedId,
    gameEnded: newState.gameEnded,
    gameOptions: newState.gameOptions,
    impostorGuessesUsed: newState.impostorGuessesUsed ?? 0,
    impostorGuessedCorrectly: newState.impostorGuessedCorrectly ?? false,
  });
});

socket.on(
  "roleAssignment",
  (roles: {
    isImpostor: boolean;
    secretWord: string | null;
    secretCategory: string | null;
  }) => {
    if (!socket.connected) return;
    useGameStore.setState({
      amIImpostor: roles.isImpostor,
      secretWord: roles.secretWord,
      secretCategory: roles.secretCategory,
    });
  },
);

socket.on("strokeUpdate", (stroke: StrokeData) => {
  if (!socket.connected) return;
  useGameStore.setState((state) => ({
    canvasStrokes: [...state.canvasStrokes, stroke],
  }));
});

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
    gameOptions: {
      roundTime: DEFAULT_ROUND_TIME,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      impostorGuessEnabled: false,
      impostorGuessAttempts: DEFAULT_IMPOSTOR_GUESSES,
    },
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
    currentRound: 1,
    ejectedId: null,
    gameEnded: false,
    impostorGuessesUsed: 0,
    impostorGuessedCorrectly: false,
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
