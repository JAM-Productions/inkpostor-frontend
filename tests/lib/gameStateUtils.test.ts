import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  patchMyPlayer,
  detectIsMobile,
  getSavedPlayerName,
  savePlayerName,
  getOrCreateUserId,
  clearRoomUrlParam,
  PLAYER_NAME_KEY,
  USER_ID_KEY,
} from "../../src/lib/gameStateUtils";
import type { GameState, Player } from "../../src/store/gameState";

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: `Player ${id}`,
    isConnected: true,
    score: 0,
    hasStartedEmergencyVoting: false,
    ...overrides,
  };
}

function makeState(myId: string | null, players: Player[]): GameState {
  return { myId, players } as GameState;
}

describe("patchMyPlayer", () => {
  it("applies the patch only to the local player", () => {
    const players = [makePlayer("1"), makePlayer("2"), makePlayer("3")];
    const state = makeState("2", players);

    const result = patchMyPlayer(state, { hasVoted: true });

    expect(result.players).toEqual([
      makePlayer("1"),
      makePlayer("2", { hasVoted: true }),
      makePlayer("3"),
    ]);
  });

  it("merges the patch without dropping existing fields", () => {
    const players = [makePlayer("1", { score: 5, hasVoted: false })];
    const state = makeState("1", players);

    const result = patchMyPlayer(state, { hasVoted: true });

    expect(result.players?.[0]).toMatchObject({ score: 5, hasVoted: true });
  });

  it("does not mutate the original players array or objects", () => {
    const players = [makePlayer("1")];
    const state = makeState("1", players);

    const result = patchMyPlayer(state, { hasRevealedRole: true });

    expect(result.players).not.toBe(players);
    expect(result.players?.[0]).not.toBe(players[0]);
    expect(players[0].hasRevealedRole).toBeUndefined();
  });

  it("returns the unchanged state when there is no local id", () => {
    const players = [makePlayer("1")];
    const state = makeState(null, players);

    const result = patchMyPlayer(state, { hasVoted: true });

    expect(result).toBe(state);
  });

  it("returns an unchanged players list when the local player is absent", () => {
    const players = [makePlayer("1"), makePlayer("2")];
    const state = makeState("99", players);

    const result = patchMyPlayer(state, { hasVoted: true });

    expect(result.players).toEqual(players);
  });
});

describe("detectIsMobile", () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });

  function setUserAgent(value: string) {
    Object.defineProperty(navigator, "userAgent", {
      value,
      configurable: true,
    });
  }

  it("returns true for a mobile user agent", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    expect(detectIsMobile()).toBe(true);
  });

  it("returns true for an Android user agent", () => {
    setUserAgent("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36");
    expect(detectIsMobile()).toBe(true);
  });

  it("returns false for a desktop user agent", () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    );
    expect(detectIsMobile()).toBe(false);
  });
});

describe("getSavedPlayerName / savePlayerName", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns null when no name is saved", () => {
    expect(getSavedPlayerName()).toBeNull();
  });

  it("persists and reads back the saved name", () => {
    savePlayerName("Alice");
    expect(localStorage.getItem(PLAYER_NAME_KEY)).toBe("Alice");
    expect(getSavedPlayerName()).toBe("Alice");
  });

  it("returns null when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    expect(getSavedPlayerName()).toBeNull();
  });

  it("swallows errors when localStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => savePlayerName("Bob")).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("getOrCreateUserId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("generates and persists a new id when none exists", () => {
    const id = getOrCreateUserId();
    expect(id).toBeTruthy();
    expect(localStorage.getItem(USER_ID_KEY)).toBe(id);
  });

  it("reuses the existing id from localStorage", () => {
    localStorage.setItem(USER_ID_KEY, "existing-id");
    expect(getOrCreateUserId()).toBe("existing-id");
  });

  it("returns a freshly generated id even if localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const id = getOrCreateUserId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("clearRoomUrlParam", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("removes the room query parameter while preserving others", () => {
    window.history.replaceState({}, "", "/game?room=ABC&foo=bar");

    clearRoomUrlParam();

    const url = new URL(window.location.href);
    expect(url.searchParams.has("room")).toBe(false);
    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.pathname).toBe("/game");
  });

  it("does nothing when there is no room parameter", () => {
    window.history.replaceState({}, "", "/game?foo=bar");

    expect(() => clearRoomUrlParam()).not.toThrow();
    expect(new URL(window.location.href).search).toBe("?foo=bar");
  });
});
