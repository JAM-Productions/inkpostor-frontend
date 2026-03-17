import { create } from "zustand";
import { socket, SERVER_URL } from "../socket";

function getOrCreateUserId(): string {
  const key = "inkpostor_user_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export type GamePhase =
  | "LOBBY"
  | "ROLE_REVEAL"
  | "DRAWING"
  | "VOTING"
  | "RESULTS";

export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
  score: number;
  hasVoted?: boolean;
  isEjected?: boolean;
}

export interface StrokeData {
  x: number;
  y: number;
  color: string;
  isNewStroke: boolean; // True if it's the first point of a line
}

export interface GameState {
  roomId: string | null;
  hostId: string | null;
  phase: GamePhase;
  players: Player[];
  impostorId: string | null; // Only available in RESULTS or to the impostor themselves locally
  secretWord: string | null; // Only available to non-impostors
  secretCategory: string | null;
  currentTurnPlayerId: string | null;
  turnOrder: string[];
  turnIndex: number;
  votes: Record<string, string>;
  canvasStrokes: StrokeData[];
  currentRound: number;
  ejectedId: string | null;

  // Local only state
  myId: string | null;
  myName: string | null;
  amIImpostor: boolean | null;
  errorMessage: string | null;

  // Actions mapped to Socket
  actions: {
    connectAndJoin: (roomId: string, playerName: string) => void;
    connectAndCreate: (roomId: string, playerName: string) => void;
    startGame: () => void;
    proceedToDrawing: () => void;
    drawStroke: (stroke: StrokeData) => void;
    clearCanvas: () => void;
    endTurn: () => void;
    vote: (votedForId: string) => void;
    playAgain: () => void;
    nextRound: () => void;
    setError: (msg: string | null) => void;
  };
}

export const useGameStore = create<GameState>()((set) => ({
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
  canvasStrokes: [],
  currentRound: 1,
  ejectedId: null,

  myId: null,
  myName: null,
  amIImpostor: null,
  errorMessage: null,

  actions: {
    connectAndCreate: async (roomId, playerName) => {
      try {
        const userId = getOrCreateUserId();
        const res = await fetch(`${SERVER_URL || ""}/auth`, {
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
        socket.connect();
        socket.emit("createRoom", { roomId });
        set({ myName: playerName, myId: userId });
      } catch {
        set({ errorMessage: "Server connection error." });
      }
    },
    connectAndJoin: async (roomId, playerName) => {
      try {
        const userId = getOrCreateUserId();
        const res = await fetch(`${SERVER_URL || ""}/auth`, {
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
        socket.connect();
        socket.emit("joinRoom", { roomId });
        set({ myName: playerName, myId: userId });
      } catch {
        set({ errorMessage: "Server connection error." });
      }
    },
    startGame: () => {
      socket.emit("startGame");
    },
    proceedToDrawing: () => {
      socket.emit("proceedToDrawing");
    },
    drawStroke: (stroke) => {
      socket.emit("drawStroke", stroke);
      set((state) => ({ canvasStrokes: [...state.canvasStrokes, stroke] }));
    },
    clearCanvas: () => {
      socket.emit("clearCanvas");
    },
    endTurn: () => {
      socket.emit("endTurn");
    },
    vote: (votedForId) => {
      socket.emit("vote", votedForId);
    },
    playAgain: () => {
      socket.emit("playAgain");
    },
    nextRound: () => {
      socket.emit("nextRound");
    },
    setError: (msg) => {
      set({ errorMessage: msg });
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
    socket.emit("joinRoom", { roomId: state.roomId });
  }
});

socket.on("gameStateUpdate", (newState) => {
  // Sync all server-provided state that exists on client state
  useGameStore.setState((state) => ({
    ...state,
    roomId: newState.roomId,
    hostId: newState.hostId,
    phase: newState.phase,
    players: newState.players,
    impostorId: newState.impostorId, // Usually null from server until RESULTS
    secretWord: newState.secretWord, // Usually null from server unless RESULTS
    secretCategory: newState.secretCategory,
    currentTurnPlayerId: newState.currentTurnPlayerId,
    turnOrder: newState.turnOrder,
    turnIndex: newState.turnIndex,
    votes: newState.votes,
    canvasStrokes: newState.canvasStrokes,
    currentRound: newState.currentRound,
    ejectedId: newState.ejectedId,
  }));
});

socket.on(
  "roleAssignment",
  (roles: {
    isImpostor: boolean;
    secretWord: string | null;
    secretCategory: string | null;
  }) => {
    useGameStore.setState({
      amIImpostor: roles.isImpostor,
      secretWord: roles.secretWord,
      secretCategory: roles.secretCategory,
    });
  },
);

socket.on("strokeUpdate", (stroke: StrokeData) => {
  useGameStore.setState((state) => ({
    canvasStrokes: [...state.canvasStrokes, stroke],
  }));
});

socket.on("canvasCleared", () => {
  useGameStore.setState({ canvasStrokes: [] });
});

socket.on("error", (msg: string) => {
  useGameStore.setState({ errorMessage: msg });
  socket.disconnect();
});
