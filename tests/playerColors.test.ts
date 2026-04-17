import { describe, it, expect } from "vitest";
import { getPlayerColorClass } from "../src/lib/playerColors";
import type { Player } from "../src/store/gameState";

describe("getPlayerColorClass", () => {
  const players: Player[] = Array.from({ length: 11 }, (_, i) => ({
    id: `${i + 1}`,
    name: `Player ${i + 1}`,
    isConnected: true,
    score: 0,
  }));

  const hostId = "1";

  it("should return host color for the host", () => {
    const color = getPlayerColorClass(hostId, hostId, players);
    expect(color).toContain("bg-linear-to-br from-amber-400 to-orange-500");
  });

  it("should return different colors for different players and cycle through them", () => {
    const colors = new Set();
    // Host is at index 0 (id: "1"), so we check players from index 1 to 10
    for (let i = 1; i <= 10; i++) {
      const color = getPlayerColorClass(players[i].id, hostId, players);
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
    const color1 = getPlayerColorClass("2", hostId, players);
    const color2 = getPlayerColorClass("2", hostId, players);
    expect(color1).toBe(color2);
  });

  it("should handle null playerId", () => {
    const color = getPlayerColorClass(null, hostId, players);
    expect(color).toBe("bg-stone-600 text-stone-300");
  });

  it("should handle player not in list", () => {
    const color = getPlayerColorClass("99", hostId, players);
    expect(color).toBe("bg-stone-700 text-stone-300");
  });
});
