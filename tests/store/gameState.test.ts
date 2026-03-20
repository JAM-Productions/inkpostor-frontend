import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useGameStore } from "../../src/store/gameState";
import { socket } from "../../src/socket";

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
    id: "test-socket-id",
    auth: {},
  },
  SERVER_URL: "http://localhost:3000",
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
    expect(state.players).toEqual([]);
    expect(state.canvasStrokes).toEqual([]);
    expect(state.errorMessage).toBeNull();
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

  // -----------------------------------------------------------------------
  // UUID persistence tests
  // -----------------------------------------------------------------------

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
});
