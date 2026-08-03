import { describe, it, expect } from "vitest";
import {
  getActivePlayerCardColorClass,
  getPlayerCanvasColor,
  getPlayerIconColorClass,
  getPlayerVotingCardColorClass,
} from "../src/lib/playerColors";
import { DEFAULT_CANVAS_COLOR } from "../src/lib/canvasColors";
import type { Player } from "../src/store/gameState";

describe("getPlayerIconColorClass", () => {
  const players: Player[] = Array.from({ length: 11 }, (_, i) => ({
    id: `${i + 1}`,
    name: `Player ${i + 1}`,
    isConnected: true,
    score: 0,
    hasStartedEmergencyVoting: false,
  }));

  const hostId = "1";

  it("should return host color for the host", () => {
    const color = getPlayerIconColorClass(hostId, hostId, players);
    expect(color).toContain("bg-linear-to-br from-amber-400 to-orange-500");
  });

  it("should return different colors for different players and cycle through them", () => {
    const colors = new Set();
    // Host is at index 0 (id: "1"), so we check players from index 1 to 10
    for (let i = 1; i <= 10; i++) {
      const color = getPlayerIconColorClass(players[i].id, hostId, players);
      expect(color).toContain("bg-");
      colors.add(color);
    }

    // There are 10 colors in PLAYER_COLORS.
    // Player at index 1 gets PLAYER_COLORS[1]
    // ...
    // Player at index 10 gets PLAYER_COLORS[10 % 10] = PLAYER_COLORS[0]
    // Since all 10 colors in PLAYER_COLORS are distinct, we should have 10 distinct colors.
    expect(colors.size).toBe(10);
  });

  it("should return consistent color for the same player", () => {
    const color1 = getPlayerIconColorClass("2", hostId, players);
    const color2 = getPlayerIconColorClass("2", hostId, players);
    expect(color1).toBe(color2);
  });

  it("should handle null playerId", () => {
    const color = getPlayerIconColorClass(null, hostId, players);
    expect(color).toBe("bg-stone-600 text-stone-300");
  });

  it("should handle player not in list", () => {
    const color = getPlayerIconColorClass("99", hostId, players);
    expect(color).toBe("bg-stone-700 text-stone-300");
  });

  it("should return explicit border and background classes for active cards", () => {
    const color = getActivePlayerCardColorClass("2", hostId, players);
    expect(color).toContain("bg-emerald-500/20");
    expect(color).toContain("border-emerald-500/40");
  });

  it("should return violet style for player at index 2 (third player)", () => {
    const iconColor = getPlayerIconColorClass("3", hostId, players);
    expect(iconColor).toBe("bg-violet-500 text-white");

    const activeColor = getActivePlayerCardColorClass("3", hostId, players);
    expect(activeColor).toBe("bg-violet-500/20 border border-violet-500/40");

    const votingColor = getPlayerVotingCardColorClass("3", hostId, players);
    expect(votingColor).toBe("bg-violet-500/20 border border-violet-500/40");

    const canvasColor = getPlayerCanvasColor("3", hostId, players);
    expect(canvasColor).toBe("#8b5cf6");
  });

  it("should return explicit border and background classes for voting cards", () => {
    const color = getPlayerVotingCardColorClass("2", hostId, players);
    expect(color).toContain("bg-emerald-500/20");
    expect(color).toContain("border-emerald-500/40");
  });

  describe("getPlayerCanvasColor", () => {
    it("should return a solid hex for the host", () => {
      expect(getPlayerCanvasColor(hostId, hostId, players)).toBe("#f97316");
    });

    it("should return a distinct hex per player and cycle through them", () => {
      const colors = new Set<string>();
      for (let i = 1; i <= 10; i++) {
        const color = getPlayerCanvasColor(players[i].id, hostId, players);
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
        colors.add(color);
      }

      expect(colors.size).toBe(10);
      // Index 10 wraps back around to the first style
      expect(getPlayerCanvasColor("11", hostId, players)).toBe(
        getPlayerCanvasColor("1", "2", players),
      );
    });

    it("should fall back to the default brush color", () => {
      expect(getPlayerCanvasColor(null, hostId, players)).toBe(
        DEFAULT_CANVAS_COLOR,
      );
      expect(getPlayerCanvasColor("99", hostId, players)).toBe(
        DEFAULT_CANVAS_COLOR,
      );
    });
  });
});
