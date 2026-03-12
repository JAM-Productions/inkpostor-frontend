import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VotingScreen } from "../../src/components/VotingScreen";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("VotingScreen", () => {
  const mockVote = vi.fn();

  const mockStateBase = {
    myId: "socket-123",
    players: [
      { id: "socket-123", name: "Me", hasVoted: false },
      { id: "socket-456", name: "Player 2", hasVoted: false },
      { id: "socket-789", name: "Player 3", hasVoted: true },
    ],
    votes: { "socket-789": "socket-123" },
    actions: { vote: mockVote },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders players to vote for, excluding current player", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<VotingScreen />);

    // Should not see "Me"
    expect(screen.queryByText("Me")).not.toBeInTheDocument();

    // Should see other players
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
    expect(screen.getByText("Skip Vote")).toBeInTheDocument();
  });

  it("disables confirm button initially and enables it when a player is selected", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<VotingScreen />);

    const confirmBtn = screen.getByRole("button", { name: /confirm vote/i });
    expect(confirmBtn).toBeDisabled();

    // Select Player 2
    fireEvent.click(screen.getByText("Player 2"));
    expect(confirmBtn).toBeEnabled();

    // Select Skip
    fireEvent.click(screen.getByText("Skip Vote"));
    expect(confirmBtn).toBeEnabled();
  });

  it("calls vote action with selected player id", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<VotingScreen />);

    // Select Player 2 and confirm
    const playerBtn = screen.getByText("Player 2").closest("button");
    fireEvent.click(playerBtn!);

    const confirmBtn = screen.getByRole("button", { name: /confirm vote/i });
    fireEvent.click(confirmBtn);

    expect(mockVote).toHaveBeenCalledWith("socket-456");
  });

  it("shows waiting screen if current player has voted", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Me", hasVoted: true }, // Has voted
          { id: "socket-456", name: "Player 2", hasVoted: false },
        ],
      };
      return selector(state);
    });

    render(<VotingScreen />);

    expect(screen.getByText("Vote Cast!")).toBeInTheDocument();
    expect(
      screen.getByText("Waiting for other players to vote..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirm vote/i }),
    ).not.toBeInTheDocument();
  });
});
