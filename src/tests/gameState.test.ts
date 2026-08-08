import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameState";
import { DEFAULT_GAME_OPTIONS } from "../lib/constants";

describe("gameState store multi-impostor functionality", () => {
  beforeEach(() => {
    useGameStore.setState({
      gameOptions: { ...DEFAULT_GAME_OPTIONS },
      impostorIds: [],
      impostorId: null,
      impostorTeammates: [],
      amIImpostor: false,
    });
  });

  it("should initialize default gameOptions with impostorCount: 1 and revealImpostorTeammates: true", () => {
    const state = useGameStore.getState();
    expect(state.gameOptions.impostorCount).toBe(1);
    expect(state.gameOptions.revealImpostorTeammates).toBe(true);
  });

  it("should update impostorCount and revealImpostorTeammates options", () => {
    useGameStore.setState((prev) => ({
      gameOptions: {
        ...prev.gameOptions,
        impostorCount: 2,
        revealImpostorTeammates: false,
      },
    }));

    const state = useGameStore.getState();
    expect(state.gameOptions.impostorCount).toBe(2);
    expect(state.gameOptions.revealImpostorTeammates).toBe(false);
  });

  it("should set impostorTeammates when roleAssignment event is received", () => {
    useGameStore.setState({
      amIImpostor: true,
      impostorTeammates: ["Alice", "Bob"],
    });

    const state = useGameStore.getState();
    expect(state.amIImpostor).toBe(true);
    expect(state.impostorTeammates).toEqual(["Alice", "Bob"]);
  });
});
