import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "../../src/store/gameState";
import { socket } from "../../src/socket";

// Mock the socket and fetch
vi.mock("../../src/socket", () => ({
  socket: {
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    disconnect: vi.fn(),
    id: "test-socket-id",
    auth: {},
  },
  SERVER_URL: "http://localhost:3000",
}));

global.fetch = vi.fn();

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

  it("should set error message", () => {
    const state = useGameStore.getState();
    state.actions.setError("Test error");
    expect(useGameStore.getState().errorMessage).toBe("Test error");
  });
});
