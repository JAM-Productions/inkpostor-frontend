import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useGameStore, PLAYER_NAME_KEY } from "../../src/store/gameState";
import { socket } from "../../src/socket";
import { DEFAULT_ROUND_TIME } from "../../src/lib/constants";

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

describe("useGameStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      roomId: null,
      hostId: null,
      phase: "LOBBY",
      gameOptions: {
        roundTime: DEFAULT_ROUND_TIME,
        unlimitedInk: false,
        clearCanvasEachRound: true,
      },
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
      roundTime: 90,
      unlimitedInk: false,
      clearCanvasEachRound: true,
    });

    expect(useGameStore.getState().gameOptions.roundTime).toBe(90);
  });

  it("should update unlimitedInk in the store", () => {
    const state = useGameStore.getState();

    state.actions.updateGameOptions({
      roundTime: DEFAULT_ROUND_TIME,
      unlimitedInk: true,
      clearCanvasEachRound: true,
    });

    expect(useGameStore.getState().gameOptions.unlimitedInk).toBe(true);
  });

  it("should update clearCanvasEachRound in the store", () => {
    const state = useGameStore.getState();

    state.actions.updateGameOptions({
      roundTime: DEFAULT_ROUND_TIME,
      unlimitedInk: false,
      clearCanvasEachRound: false,
    });

    expect(useGameStore.getState().gameOptions.clearCanvasEachRound).toBe(
      false,
    );
  });

  it("should emit updateGameOptions with the provided values", () => {
    const state = useGameStore.getState();
    const nextOptions = {
      roundTime: 40,
      unlimitedInk: true,
      clearCanvasEachRound: false,
    };

    state.actions.updateGameOptions(nextOptions);

    expect(socket.emit).toHaveBeenCalledWith("updateGameOptions", nextOptions);
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
    expect(socket.emit).toHaveBeenCalledWith("createRoom", { roomId: "room1" });
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
      gameOptions: {
        roundTime: DEFAULT_ROUND_TIME,
        unlimitedInk: false,
        clearCanvasEachRound: true,
      },
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
        roundTime: 40,
        unlimitedInk: true,
        clearCanvasEachRound: false,
      },
    });

    kicked("You were kicked from the room");

    expect(useGameStore.getState().gameOptions).toEqual({
      roundTime: DEFAULT_ROUND_TIME,
      unlimitedInk: false,
      clearCanvasEachRound: true,
    });
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
  });
});
