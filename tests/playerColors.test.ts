import { describe, it, expect } from "vitest";
import { getPlayerColorClass } from "../src/lib/playerColors";
import { Player } from "../src/store/gameState";

describe("getPlayerColorClass", () => {
  const players: Player[] = [
    { id: "1", name: "Alice", isConnected: true, score: 0 },
    { id: "2", name: "Bob", isConnected: true, score: 0 },
    { id: "3", name: "Charlie", isConnected: true, score: 0 },
  ];

  it("should return host color for the host", () => {
    const color = getPlayerColorClass("1", "1", players);
    expect(color).toContain("bg-linear-to-br from-amber-400 to-orange-500");
  });

  it("should return different colors for different players", () => {
    const color1 = getPlayerColorClass("2", "1", players);
    const color2 = getPlayerColorClass("3", "1", players);
    expect(color1).not.toBe(color2);
    expect(color1).toContain("bg-");
    expect(color2).toContain("bg-");
  });

  it("should return consistent color for the same player", () => {
    const color1 = getPlayerColorClass("2", "1", players);
    const color2 = getPlayerColorClass("2", "1", players);
    expect(color1).toBe(color2);
  });

  it("should handle null playerId", () => {
    const color = getPlayerColorClass(null, "1", players);
    expect(color).toBe("bg-stone-600 text-stone-300");
  });

  it("should handle player not in list", () => {
    const color = getPlayerColorClass("4", "1", players);
    expect(color).toBe("bg-stone-700 text-stone-300");
  });
});
