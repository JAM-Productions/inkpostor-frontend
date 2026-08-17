import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  useGameStore,
  type GameMode,
  type GameOptions,
} from "../../src/store/gameState";
import { PLAYER_NAME_KEY } from "../../src/lib/gameStateUtils";
import { socket } from "../../src/socket";
import {
  DEFAULT_GAME_OPTIONS,
  DEFAULT_ROUND_TIME,
} from "../../src/lib/constants";

const { socketListeners } = vi.hoisted(() => ({
  socketListeners: new Map<string, (...args: any[]) => void>(),
}));

// Mock the socket and fetch
vi.mock("../../src/socket", () => ({
  socket: {
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn((event: string, callback: (...args: any[]) => void) => {
      socketListeners.set(event, callback);
    }),
    disconnect: vi.fn(),
    connected: true,
    id: "test-socket-id",
    auth: {},
    io: {
      reconnection: vi.fn(),
    },
  },
  SERVICE_URL: "http://localhost:3000",
}));

global.fetch = vi.fn();

function getSocketListener(eventName: string) {
  const listener = socketListeners.get(eventName);

  if (!listener) {
    throw new Error(`Socket listener for "${eventName}" was not registered`);
  }

  return listener;
}

// Minimal server payload shape for gameStateUpdate assertions
const baseServerState = {
  roomId: "ROOM42",
  hostId: "host-123",
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
  gameEnded: false,
  gameOptions: { ...DEFAULT_GAME_OPTIONS },
};

describe("useGameStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      roomId: null,
      hostId: null,
      phase: "LOBBY",
      gameOptions: { ...DEFAULT_GAME_OPTIONS },
      gameMode: "CLASSIC",
      players: [],
      impostorId: null,
      secretWord: null,
      secretCategory: null,
      currentTurnPlayerId: null,
      turnOrder: [],
      turnIndex: 0,
      votes: {},
      canvasStrokes: [],
      myId: null,
      myName: null,
      amIImpostor: null,
      errorMessage: null,
    });
    vi.clearAllMocks();
  });

  it("should have initial state", () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe("LOBBY");
    expect(state.gameOptions.roundTime).toBe(DEFAULT_ROUND_TIME);
    expect(state.gameOptions.unlimitedInk).toBe(false);
    expect(state.gameOptions.clearCanvasEachRound).toBe(true);
    expect(state.players).toEqual([]);
    expect(state.canvasStrokes).toEqual([]);
    expect(state.errorMessage).toBeNull();
  });

  it("should update roundTime in the store", () => {
    const state = useGameStore.getState();

    state.actions.updateGameOptions({
      ...DEFAULT_GAME_OPTIONS,
      gameMode: "CLASSIC",
      roundTime: 90,
    });

    expect(useGameStore.getState().gameOptions.roundTime).toBe(90);
  });

  it("should update unlimitedInk in the store", () => {
    const state = useGameStore.getState();

    state.actions.updateGameOptions({
      ...DEFAULT_GAME_OPTIONS,
      gameMode: "CLASSIC",
      unlimitedInk: true,
    });

    expect(useGameStore.getState().gameOptions.unlimitedInk).toBe(true);
  });

  it("should update clearCanvasEachRound in the store", () => {
    const state = useGameStore.getState();

    state.actions.updateGameOptions({
      ...DEFAULT_GAME_OPTIONS,
      gameMode: "CLASSIC",
      clearCanvasEachRound: false,
    });

    expect(useGameStore.getState().gameOptions.clearCanvasEachRound).toBe(
      false,
    );
  });

  it("should emit updateGameOptions with the provided values, mode included", () => {
    const state = useGameStore.getState();
    const nextOptions: GameOptions & { gameMode: GameMode } = {
      ...DEFAULT_GAME_OPTIONS,
      gameMode: "HOT_WORD",
      roundTime: 40,
      unlimitedInk: true,
      clearCanvasEachRound: false,
    };

    state.actions.updateGameOptions(nextOptions);

    expect(socket.emit).toHaveBeenCalledWith("updateGameOptions", nextOptions);
    // The mode is saved with the options, not applied on its own
    expect(useGameStore.getState().gameMode).toBe("HOT_WORD");
    expect(useGameStore.getState().gameOptions.roundTime).toBe(40);
  });

  it("should keep what the host chose apart from what the mode makes of it", () => {
    const state = useGameStore.getState();

    state.actions.updateGameOptions({
      ...DEFAULT_GAME_OPTIONS,
      // HOT_WORD draws a new word every round, so it owns this one
      gameMode: "HOT_WORD",
      clearCanvasEachRound: false,
      playerColorsEnabled: false,
    });

    // What the game runs on carries the lock...
    expect(useGameStore.getState().gameOptions.clearCanvasEachRound).toBe(true);
    // ...what the host picked doesn't, so it comes back in another mode
    expect(useGameStore.getState().hostGameOptions.clearCanvasEachRound).toBe(
      false,
    );
    expect(useGameStore.getState().hostGameOptions.playerColorsEnabled).toBe(
      false,
    );

    state.actions.updateGameOptions({
      ...useGameStore.getState().hostGameOptions,
      gameMode: "CLASSIC",
    });
    expect(useGameStore.getState().gameOptions.clearCanvasEachRound).toBe(
      false,
    );
  });

  it("should fall back to the effective options when the server omits the host ones", () => {
    const gameStateUpdate = getSocketListener("gameStateUpdate");

    gameStateUpdate({
      ...baseServerState,
      phase: "LOBBY",
      gameOptions: { ...DEFAULT_GAME_OPTIONS, roundTime: 35 },
    });

    expect(useGameStore.getState().hostGameOptions.roundTime).toBe(35);
  });

  it("should handle connectAndCreate success", async () => {
    const mockToken = "mock-token";
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    });

    const state = useGameStore.getState();
    await state.actions.connectAndCreate("room1", "Player 1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/auth",
      expect.any(Object),
    );
    expect(socket.auth).toEqual({ token: mockToken });
    expect(socket.connect).toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("createRoom", {
      roomId: "room1",
      language: "en",
    });
    expect(useGameStore.getState().myName).toBe("Player 1");
  });

  it("should handle connectAndCreate failure", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Auth failed custom" }),
    });

    const state = useGameStore.getState();
    await state.actions.connectAndCreate("room1", "Player 1");

    expect(useGameStore.getState().errorMessage).toBe("Auth failed custom");
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it("should update state to store strokes on drawStroke", () => {
    const state = useGameStore.getState();
    const stroke = { x: 10, y: 10, color: "black", isNewStroke: true };

    state.actions.drawStroke(stroke);

    expect(socket.emit).toHaveBeenCalledWith("drawStroke", stroke);
    expect(useGameStore.getState().canvasStrokes).toEqual([stroke]);
  });

  it("should emit undoStroke when undoStroke action is called", () => {
    const state = useGameStore.getState();

    state.actions.undoStroke();

    expect(socket.emit).toHaveBeenCalledWith("undoStroke");
  });

  it("should remove the most recent stroke group when strokeUndone is received", () => {
    const strokeUndone = getSocketListener("strokeUndone");
    const firstStroke = { x: 0, y: 0, color: "black", isNewStroke: true };
    const firstStrokeContinuation = {
      x: 1,
      y: 1,
      color: "black",
      isNewStroke: false,
    };
    const secondStroke = { x: 10, y: 10, color: "red", isNewStroke: true };
    const secondStrokeContinuation = {
      x: 11,
      y: 11,
      color: "red",
      isNewStroke: false,
    };

    useGameStore.setState({
      canvasStrokes: [
        firstStroke,
        firstStrokeContinuation,
        secondStroke,
        secondStrokeContinuation,
      ],
    });

    strokeUndone();

    expect(useGameStore.getState().canvasStrokes).toEqual([
      firstStroke,
      firstStrokeContinuation,
    ]);
  });

  it("should clear the canvas when strokeUndone removes the only stroke group", () => {
    const strokeUndone = getSocketListener("strokeUndone");
    const firstStroke = { x: 0, y: 0, color: "black", isNewStroke: true };
    const firstStrokeContinuation = {
      x: 1,
      y: 1,
      color: "black",
      isNewStroke: false,
    };

    useGameStore.setState({
      canvasStrokes: [firstStroke, firstStrokeContinuation],
    });

    strokeUndone();

    expect(useGameStore.getState().canvasStrokes).toEqual([]);
  });

  it("should set error message", () => {
    const state = useGameStore.getState();
    state.actions.setError("Test error");
    expect(useGameStore.getState().errorMessage).toBe("Test error");
  });

  it("should reset roomId and hostId to null when kicked is received", () => {
    const kicked = getSocketListener("kicked");

    useGameStore.setState({
      roomId: "ROOM42",
      hostId: "host-123",
      myId: "player-456",
      myName: "Alice",
      players: [
        {
          id: "host-123",
          name: "Host",
          isConnected: true,
          score: 0,
          hasStartedEmergencyVoting: false,
        },
      ],
    });

    kicked("You were kicked from the room");

    const state = useGameStore.getState();
    expect(state.roomId).toBeNull();
    expect(state.hostId).toBeNull();
    expect(state.errorMessage).toBe("You were kicked from the room");
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it("should optimistically update local state on vote action", () => {
    const myId = "voter-id";
    const targetPlayerId = "target-id";

    useGameStore.setState({
      myId,
      players: [
        {
          id: myId,
          name: "Voter",
          isConnected: true,
          score: 0,
          hasVoted: false,
          hasStartedEmergencyVoting: false,
        },
        {
          id: targetPlayerId,
          name: "Target",
          isConnected: true,
          score: 0,
          hasVoted: false,
          hasStartedEmergencyVoting: false,
        },
      ],
      votes: {},
    });

    const state = useGameStore.getState();
    state.actions.vote(targetPlayerId);

    // Verify socket emission
    expect(socket.emit).toHaveBeenCalledWith("vote", targetPlayerId);

    // Verify optimistic store update
    const updatedState = useGameStore.getState();
    expect(updatedState.votes[myId]).toBe(targetPlayerId);

    const myself = updatedState.players.find((p) => p.id === myId);
    expect(myself?.hasVoted).toBe(true);
  });

  it("should not emit vote or update state if myId is missing", () => {
    useGameStore.setState({
      myId: null,
      players: [],
      votes: {},
    });

    const state = useGameStore.getState();
    state.actions.vote("target-player");

    expect(socket.emit).not.toHaveBeenCalledWith("vote", expect.anything());
  });

  it("should not emit vote or update state if player has already voted", () => {
    const myId = "voter-id";
    useGameStore.setState({
      myId,
      players: [
        {
          id: myId,
          name: "Voter",
          isConnected: true,
          score: 0,
          hasVoted: true,
          hasStartedEmergencyVoting: false,
        }, // Already voted
      ],
      votes: { [myId]: "some-player" },
    });

    const state = useGameStore.getState();
    state.actions.vote("target-player");

    expect(socket.emit).not.toHaveBeenCalledWith("vote", "target-player");
  });

  it("should not emit vote or update state if player is ejected", () => {
    const myId = "voter-id";
    useGameStore.setState({
      myId,
      players: [
        {
          id: myId,
          name: "Voter",
          isConnected: true,
          score: 0,
          isEjected: true,
          hasVoted: false,
          hasStartedEmergencyVoting: false,
        }, // Ejected
      ],
      votes: {},
    });

    const state = useGameStore.getState();
    state.actions.vote("target-player");

    expect(socket.emit).not.toHaveBeenCalledWith("vote", "target-player");
  });

  it("should emit endGame when endGame action is called", () => {
    const state = useGameStore.getState();

    state.actions.endGame();

    expect(socket.emit).toHaveBeenCalledWith("endGame");
  });

  it("should emit kickPlayer when kickPlayer action is called", () => {
    const state = useGameStore.getState();

    state.actions.kickPlayer("target-id");

    expect(socket.emit).toHaveBeenCalledWith("kickPlayer", {
      playerId: "target-id",
    });
  });

  it("should emit voteKickPlayer when voteKickPlayer action is called", () => {
    const state = useGameStore.getState();

    state.actions.voteKickPlayer("target-id");

    expect(socket.emit).toHaveBeenCalledWith("voteKickPlayer", {
      targetId: "target-id",
    });
  });

  it("should update kickVotes on gameStateUpdate", () => {
    const gameStateUpdate = getSocketListener("gameStateUpdate");

    gameStateUpdate({
      phase: "DRAWING",
      players: [],
      votes: {},
      kickVotes: { "target-id": ["voter-1"] },
      canvasStrokes: [],
      turnOrder: [],
      turnIndex: 0,
      currentRound: 1,
    });

    expect(useGameStore.getState().kickVotes).toEqual({
      "target-id": ["voter-1"],
    });
  });

  it("should optimistically update local state on startEmergencyVoting action", () => {
    const myId = "player-id";

    useGameStore.setState({
      myId,
      players: [
        {
          id: myId,
          name: "Player",
          isConnected: true,
          score: 0,
          isEjected: false,
          hasStartedEmergencyVoting: false,
        },
        {
          id: "other-player",
          name: "Other Player",
          isConnected: true,
          score: 0,
          isEjected: false,
          hasStartedEmergencyVoting: false,
        },
      ],
    });

    const state = useGameStore.getState();
    state.actions.startEmergencyVoting();

    expect(socket.emit).toHaveBeenCalledWith("startEmergencyVoting");

    const updatedState = useGameStore.getState();
    const me = updatedState.players.find((player) => player.id === myId);
    const otherPlayer = updatedState.players.find(
      (player) => player.id === "other-player",
    );

    expect(me?.hasStartedEmergencyVoting).toBe(true);
    expect(otherPlayer?.hasStartedEmergencyVoting).toBe(false);
  });

  it("should reset isSuspected when a new game starts (LOBBY or ROLE_REVEAL phase)", () => {
    useGameStore.setState({
      phase: "DRAWING",
      players: [
        {
          id: "player1",
          name: "SusPlayer",
          isConnected: true,
          score: 0,
          isSuspected: true,
          hasStartedEmergencyVoting: false,
        },
      ],
    });

    const gameStateUpdate = getSocketListener("gameStateUpdate");

    gameStateUpdate({
      phase: "LOBBY",
      players: [
        {
          id: "player1",
          name: "SusPlayer",
          isConnected: true,
          score: 0,
        },
      ],
      votes: {},
      canvasStrokes: [],
      turnOrder: [],
      turnIndex: 0,
      currentRound: 1,
    });

    const updatedPlayers = useGameStore.getState().players;
    expect(updatedPlayers[0].isSuspected).toBe(false);
  });

  it("should sync gameOptions from gameStateUpdate", () => {
    const gameStateUpdate = getSocketListener("gameStateUpdate");

    useGameStore.setState({
      gameOptions: { ...DEFAULT_GAME_OPTIONS },
    });

    gameStateUpdate({
      roomId: "ROOM42",
      hostId: "host-123",
      phase: "DRAWING",
      players: [],
      impostorId: null,
      secretWord: null,
      secretCategory: null,
      currentTurnPlayerId: null,
      turnOrder: [],
      turnIndex: 0,
      votes: {},
      canvasStrokes: [],
      currentRound: 2,
      ejectedId: null,
      gameEnded: false,
      gameOptions: {
        roundTime: 40,
        unlimitedInk: true,
        clearCanvasEachRound: false,
      },
    });

    expect(useGameStore.getState().gameOptions).toEqual({
      roundTime: 40,
      unlimitedInk: true,
      clearCanvasEachRound: false,
    });
  });

  describe("game mode & custom word", () => {
    it("should sync gameMode from gameStateUpdate", () => {
      const gameStateUpdate = getSocketListener("gameStateUpdate");

      gameStateUpdate({
        ...baseServerState,
        phase: "LOBBY",
        gameMode: "CUSTOM_WORD",
      });

      expect(useGameStore.getState().gameMode).toBe("CUSTOM_WORD");
    });

    it("should default gameMode to CLASSIC when the server omits it", () => {
      useGameStore.setState({ gameMode: "CUSTOM_WORD" });
      const gameStateUpdate = getSocketListener("gameStateUpdate");

      gameStateUpdate({ ...baseServerState, phase: "LOBBY" });

      expect(useGameStore.getState().gameMode).toBe("CLASSIC");
    });

    it("should emit submitCustomWord trimmed and mark the player as submitted", () => {
      useGameStore.setState({
        myId: "player1",
        players: [
          {
            id: "player1",
            name: "Alice",
            isConnected: true,
            score: 0,
            hasStartedEmergencyVoting: false,
          },
        ],
      });

      useGameStore.getState().actions.submitCustomWord("  Lighthouse  ");

      expect(socket.emit).toHaveBeenCalledWith("submitCustomWord", {
        word: "Lighthouse",
      });
      expect(useGameStore.getState().players[0].hasSubmittedWord).toBe(true);
    });

    it("should ignore an empty custom word", () => {
      useGameStore.getState().actions.submitCustomWord("   ");

      expect(socket.emit).not.toHaveBeenCalled();
    });

    it("should clear the previous secret word when entering WORD_SELECTION", () => {
      useGameStore.setState({
        secretWord: "Elephant",
        secretCategory: "Animals",
      });
      const gameStateUpdate = getSocketListener("gameStateUpdate");

      gameStateUpdate({
        ...baseServerState,
        phase: "WORD_SELECTION",
        gameMode: "CUSTOM_WORD",
      });

      expect(useGameStore.getState().secretWord).toBeNull();
      expect(useGameStore.getState().secretCategory).toBeNull();
    });

    it("should emit confirmNewWord and mark the player as done", () => {
      useGameStore.setState({
        myId: "player1",
        players: [
          {
            id: "player1",
            name: "Alice",
            isConnected: true,
            score: 0,
            hasStartedEmergencyVoting: false,
          },
        ],
      });

      useGameStore.getState().actions.confirmNewWord();

      expect(socket.emit).toHaveBeenCalledWith("confirmNewWord");
      expect(useGameStore.getState().players[0].hasRevealedNewWord).toBe(true);
    });

    it("should emit confirmOrder and mark the player as done", () => {
      useGameStore.setState({
        myId: "player1",
        players: [
          {
            id: "player1",
            name: "Alice",
            isConnected: true,
            score: 0,
            hasStartedEmergencyVoting: false,
          },
        ],
      });

      useGameStore.getState().actions.confirmOrder();

      expect(socket.emit).toHaveBeenCalledWith("confirmOrder");
      expect(useGameStore.getState().players[0].hasConfirmedOrder).toBe(true);
    });

    it("should emit revealResults without touching the phase itself", () => {
      useGameStore.setState({ phase: "ORDER_INFO", gameEnded: false });

      useGameStore.getState().actions.revealResults();

      expect(socket.emit).toHaveBeenCalledWith("revealResults");
      // This one ends the game, so the screen only moves on the server's word
      expect(useGameStore.getState().phase).toBe("ORDER_INFO");
      expect(useGameStore.getState().gameEnded).toBe(false);
    });

    it("should reset gameMode when kicked is received", () => {
      useGameStore.setState({ gameMode: "CUSTOM_WORD" });
      const kicked = getSocketListener("kicked");

      kicked("You were kicked");

      expect(useGameStore.getState().gameMode).toBe("CLASSIC");
    });
  });

  it("should not allow toggling sus on ejected players", () => {
    useGameStore.setState({
      players: [
        {
          id: "player1",
          name: "EjectedPlayer",
          isConnected: true,
          score: 0,
          isSuspected: false,
          isEjected: true,
          hasStartedEmergencyVoting: false,
        },
      ],
    });

    const state = useGameStore.getState();
    state.actions.toggleSus("player1");

    expect(useGameStore.getState().players[0].isSuspected).toBe(false);
  });

  it("should clear isSuspected from a player if they become ejected in an update", () => {
    useGameStore.setState({
      players: [
        {
          id: "player1",
          name: "SusPlayer",
          isConnected: true,
          score: 0,
          isSuspected: true,
          isEjected: false,
          hasStartedEmergencyVoting: false,
        },
      ],
    });

    const gameStateUpdate = getSocketListener("gameStateUpdate");

    gameStateUpdate({
      phase: "DRAWING",
      players: [
        {
          id: "player1",
          name: "SusPlayer",
          isConnected: true,
          score: 0,
          isEjected: true, // Became ejected
        },
      ],
      votes: {},
      canvasStrokes: [],
      turnOrder: [],
      turnIndex: 0,
      currentRound: 1,
    });

    const updatedPlayers = useGameStore.getState().players;
    expect(updatedPlayers[0].isSuspected).toBe(false);
  });

  it("should reset gameOptions to defaults when kicked is received", () => {
    const kicked = getSocketListener("kicked");

    useGameStore.setState({
      gameOptions: {
        ...DEFAULT_GAME_OPTIONS,
        roundTime: 40,
        unlimitedInk: true,
        clearCanvasEachRound: false,
      },
    });

    kicked("You were kicked from the room");

    expect(useGameStore.getState().gameOptions).toEqual(DEFAULT_GAME_OPTIONS);
  });

  // -----------------------------------------------------------------------
  // Secret-word race-condition tests (fix: gameStateUpdate must not clobber
  // the secretWord that was already set by a roleAssignment event)
  // -----------------------------------------------------------------------

  describe("secretWord race-condition fix", () => {
    it("should preserve secretWord when a sanitized gameStateUpdate (null) arrives after roleAssignment", () => {
      const roleAssignment = getSocketListener("roleAssignment");
      const gameStateUpdate = getSocketListener("gameStateUpdate");

      // 1. roleAssignment arrives first with the real word
      roleAssignment({
        isImpostor: false,
        secretWord: "pizza",
        secretCategory: "food",
      });

      expect(useGameStore.getState().secretWord).toBe("pizza");

      // 2. gameStateUpdate arrives later with sanitized state (secretWord: null)
      //    — this is the race condition that used to wipe the word
      gameStateUpdate({
        phase: "ROLE_REVEAL",
        players: [],
        votes: {},
        kickVotes: {},
        canvasStrokes: [],
        turnOrder: [],
        turnIndex: 0,
        currentRound: 1,
        secretWord: null, // sanitized
        secretCategory: null, // sanitized
        impostorId: null,
      });

      // The word must still be "pizza", not null
      expect(useGameStore.getState().secretWord).toBe("pizza");
      expect(useGameStore.getState().secretCategory).toBe("food");
    });

    it("should clear secretWord when a gameStateUpdate with LOBBY phase is received", () => {
      const roleAssignment = getSocketListener("roleAssignment");
      const gameStateUpdate = getSocketListener("gameStateUpdate");

      // Simulate a previous game where the player knew the word
      roleAssignment({
        isImpostor: false,
        secretWord: "pizza",
        secretCategory: "food",
      });

      expect(useGameStore.getState().secretWord).toBe("pizza");

      // Host starts a new game → playAgain resets to LOBBY
      gameStateUpdate({
        phase: "LOBBY",
        players: [],
        votes: {},
        kickVotes: {},
        canvasStrokes: [],
        turnOrder: [],
        turnIndex: 0,
        currentRound: 1,
        secretWord: null,
        secretCategory: null,
        impostorId: null,
      });

      // Old secrets must be wiped, not carried into the new game
      expect(useGameStore.getState().secretWord).toBeNull();
      expect(useGameStore.getState().secretCategory).toBeNull();
    });

    it("should use the server secretWord from a RESULTS gameStateUpdate (full unsanitized state)", () => {
      const roleAssignment = getSocketListener("roleAssignment");
      const gameStateUpdate = getSocketListener("gameStateUpdate");

      // Player is the impostor and doesn't know the word locally
      roleAssignment({
        isImpostor: true,
        secretWord: null,
        secretCategory: "food",
      });

      expect(useGameStore.getState().secretWord).toBeNull();

      // Voting ends → RESULTS: server reveals the full state including the real word
      gameStateUpdate({
        phase: "RESULTS",
        players: [],
        votes: {},
        kickVotes: {},
        canvasStrokes: [],
        turnOrder: [],
        turnIndex: 0,
        currentRound: 1,
        secretWord: "pizza", // real word revealed at end of game
        secretCategory: "food",
        impostorId: "impostor-id",
      });

      expect(useGameStore.getState().secretWord).toBe("pizza");
    });
  });

  // -----------------------------------------------------------------------
  // Persistence tests
  // -----------------------------------------------------------------------

  describe("Player name persistence", () => {
    afterEach(() => {
      localStorage.removeItem(PLAYER_NAME_KEY);
    });

    it("connectAndCreate should persist playerName in localStorage", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "mock-token" }),
      });

      await useGameStore.getState().actions.connectAndCreate("room1", "Alice");

      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBe("Alice");
    });

    it("connectAndJoin should persist playerName in localStorage", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "mock-token" }),
      });

      await useGameStore.getState().actions.connectAndJoin("room1", "Bob");

      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBe("Bob");
    });
  });

  describe("UUID persistence (getOrCreateUserId)", () => {
    afterEach(() => {
      localStorage.removeItem("inkpostor_user_id");
    });

    it("connectAndCreate should send userId in the auth request body", async () => {
      const fixedUUID = "fixed-uuid-create-test";
      localStorage.setItem("inkpostor_user_id", fixedUUID);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok" }),
      });

      await useGameStore.getState().actions.connectAndCreate("r1", "Alice");

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.userId).toBe(fixedUUID);
      expect(body.username).toBe("Alice");
    });

    it("connectAndJoin should send userId in the auth request body", async () => {
      const fixedUUID = "fixed-uuid-join-test";
      localStorage.setItem("inkpostor_user_id", fixedUUID);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok" }),
      });

      await useGameStore.getState().actions.connectAndJoin("r1", "Bob");

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.userId).toBe(fixedUUID);
      expect(body.username).toBe("Bob");
    });

    it("connectAndCreate should set myId to the localStorage UUID", async () => {
      const fixedUUID = "fixed-uuid-for-myid";
      localStorage.setItem("inkpostor_user_id", fixedUUID);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok" }),
      });

      await useGameStore.getState().actions.connectAndCreate("r1", "Alice");

      expect(useGameStore.getState().myId).toBe(fixedUUID);
    });

    it("connectAndJoin should set myId to the localStorage UUID", async () => {
      const fixedUUID = "fixed-uuid-for-join-myid";
      localStorage.setItem("inkpostor_user_id", fixedUUID);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok" }),
      });

      await useGameStore.getState().actions.connectAndJoin("r1", "Bob");

      expect(useGameStore.getState().myId).toBe(fixedUUID);
    });

    it("should generate and persist a new UUID in localStorage if none exists", async () => {
      localStorage.removeItem("inkpostor_user_id");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok" }),
      });

      await useGameStore.getState().actions.connectAndCreate("r1", "Alice");

      const storedId = localStorage.getItem("inkpostor_user_id");
      expect(storedId).not.toBeNull();
      expect(typeof storedId).toBe("string");
      expect(storedId!.length).toBeGreaterThan(0);

      // The stored UUID should also be what was sent in the fetch call
      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.userId).toBe(storedId);
    });

    it("should reuse the same UUID across multiple sessions (non-null localStorage)", async () => {
      localStorage.removeItem("inkpostor_user_id");

      // First session
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok1" }),
      });
      await useGameStore.getState().actions.connectAndCreate("r1", "Alice");
      const firstUUID = localStorage.getItem("inkpostor_user_id");

      vi.clearAllMocks();

      // Second session (same browser, same localStorage)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "tok2" }),
      });
      await useGameStore.getState().actions.connectAndCreate("r2", "Alice");
      const secondUUID = localStorage.getItem("inkpostor_user_id");

      expect(firstUUID).toBe(secondUUID);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.userId).toBe(firstUUID);
    });
  });

  describe("exitGame action", () => {
    it("should disconnect the socket, disable reconnection, and reset game state to defaults, preserving myId and myName", () => {
      useGameStore.setState({
        roomId: "ROOM123",
        hostId: "host-id",
        phase: "DRAWING",
        players: [
          {
            id: "my-id",
            name: "Alice",
            isConnected: true,
            score: 0,
            hasStartedEmergencyVoting: false,
          },
        ],
        impostorId: "host-id",
        secretWord: "Apple",
        secretCategory: "Food",
        myId: "my-id",
        myName: "Alice",
      });

      const state = useGameStore.getState();
      state.actions.exitGame();

      expect(socket.disconnect).toHaveBeenCalled();
      expect(socket.io.reconnection).toHaveBeenCalledWith(false);

      const updatedState = useGameStore.getState();
      expect(updatedState.roomId).toBeNull();
      expect(updatedState.hostId).toBeNull();
      expect(updatedState.phase).toBe("LOBBY");
      expect(updatedState.players).toEqual([]);
      expect(updatedState.secretWord).toBeNull();
      expect(updatedState.secretCategory).toBeNull();
      expect(updatedState.myId).toBe("my-id");
      expect(updatedState.myName).toBe("Alice");
    });

    it("updates store state and handles impostorIds fallback on gameStateUpdate socket event", () => {
      const listener = getSocketListener("gameStateUpdate");
      listener({
        ...baseServerState,
        impostorId: "imp-1",
        impostorIds: ["imp-1", "imp-2"],
      });

      let state = useGameStore.getState();
      expect(state.impostorIds).toEqual(["imp-1", "imp-2"]);

      listener({
        ...baseServerState,
        impostorId: "imp-1",
        impostorIds: undefined,
      });

      state = useGameStore.getState();
      expect(state.impostorIds).toEqual(["imp-1"]);
    });
  });
});
