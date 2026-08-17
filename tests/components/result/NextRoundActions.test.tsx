import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRoundActions } from "../../../src/components/result/NextRoundActions";
import { useGameStore, type Player } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("NextRoundActions", () => {
  const mockNextRound = vi.fn();

  const createPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: "p1",
    name: "Alice",
    isConnected: true,
    score: 0,
    hasStartedEmergencyVoting: false,
    ...overrides,
  });

  const players = [
    createPlayer({ id: "p1", name: "Alice", hasConfirmedNewRound: true }),
    createPlayer({ id: "p2", name: "Bob" }),
    createPlayer({ id: "p3", name: "Charlie", isEjected: true }),
    createPlayer({ id: "p4", name: "Dana", isConnected: false }),
  ];

  const renderActions = (props: Partial<typeof defaults> = {}) =>
    render(<NextRoundActions {...defaults} {...props} />);

  const defaults = {
    players,
    hasConfirmedNewRound: false,
    amIEjected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({ actions: { nextRound: mockNextRound } }),
    );
  });

  it("asks for the next round while this player has not", () => {
    renderActions();

    fireEvent.click(screen.getByTestId("next-round-btn"));
    expect(mockNextRound).toHaveBeenCalledTimes(1);
  });

  it("counts only the players a round is waited on", () => {
    // Alice confirmed; Charlie is out and Dana is gone, so neither is waited for
    renderActions({ hasConfirmedNewRound: true });

    expect(screen.queryByTestId("next-round-btn")).not.toBeInTheDocument();
    expect(
      screen.getByText("1 of 2 players have confirmed to continue"),
    ).toBeInTheDocument();
  });

  it("gives an ejected player the counter instead of the button", () => {
    renderActions({ amIEjected: true });

    expect(screen.queryByTestId("next-round-btn")).not.toBeInTheDocument();
    expect(
      screen.getByText("1 of 2 players have confirmed to continue"),
    ).toBeInTheDocument();
  });
});
