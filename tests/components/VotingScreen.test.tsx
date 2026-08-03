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
    amIImpostor: null,
    impostorGuessesUsed: 0,
    gameOptions: {
      roundTime: 20,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders players to vote for, adding current player", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<VotingScreen />);

    // Should see "Me"
    expect(screen.getByText("Me")).toBeInTheDocument();

    // Should see other players
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
    expect(screen.getByText("Skip Vote")).toBeInTheDocument();
  });

  it("offers the canvas preview thumbnail", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ ...mockStateBase }),
    );

    render(<VotingScreen />);

    expect(
      screen.getByRole("button", { name: "View drawing" }),
    ).toBeInTheDocument();
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

  it("prevents double submission on fast clicks and disables confirm button", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<VotingScreen />);

    // Select Player 2
    const playerBtn = screen.getByText("Player 2").closest("button");
    fireEvent.click(playerBtn!);

    const confirmBtn = screen.getByRole("button", { name: /confirm vote/i });

    // Simulate fast double click
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    // Vote should only be called once because isSubmitting disables it
    expect(mockVote).toHaveBeenCalledTimes(1);
    expect(mockVote).toHaveBeenCalledWith("socket-456");
    expect(confirmBtn).toBeDisabled();
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

    // Player list should still be visible
    expect(screen.getByText("Player 2")).toBeInTheDocument();

    // Buttons should be disabled
    const player2Btn = screen.getByText("Player 2").closest("button");
    expect(player2Btn).toBeDisabled();

    const skipBtn = screen.getByText("Skip Vote").closest("button");
    expect(skipBtn).toBeDisabled();
  });

  it("keeps the voted option highlighted using fallback if votes[myId] is missing", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Me", hasVoted: false },
          { id: "socket-456", name: "Player 2", hasVoted: false },
        ],
        votes: {},
      };
      return selector(state);
    });

    const { rerender } = render(<VotingScreen />);

    // Select Player 2
    fireEvent.click(screen.getByText("Player 2"));

    // Rerender as if voted but store hasn't updated votes map yet
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Me", hasVoted: true },
          { id: "socket-456", name: "Player 2", hasVoted: false },
        ],
        votes: {},
      };
      return selector(state);
    });

    rerender(<VotingScreen />);

    const player2Btn = screen.getByText("Player 2").closest("button");
    expect(player2Btn).toHaveClass("border-ink-primary");
  });

  it("disables voting on ejected players", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Me", hasVoted: false },
          {
            id: "socket-456",
            name: "Player 2",
            hasVoted: false,
            isEjected: true,
          }, // Ejected player
          { id: "socket-789", name: "Player 3", hasVoted: false },
        ],
      };
      return selector(state);
    });

    render(<VotingScreen />);

    const ejectedPlayerBtn = screen.getByText("Player 2").closest("button");
    expect(ejectedPlayerBtn).toBeDisabled();

    const normalPlayerBtn = screen.getByText("Player 3").closest("button");
    expect(normalPlayerBtn).not.toBeDisabled();
  });

  it("disables voting interface if current player is ejected", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Me", hasVoted: false, isEjected: true }, // Me ejected
          { id: "socket-456", name: "Player 2", hasVoted: false },
        ],
      };
      return selector(state);
    });

    render(<VotingScreen />);

    expect(screen.getByText("You have been ejected")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirm vote/i }),
    ).not.toBeInTheDocument();

    // Other players should be disabled
    const otherPlayerBtn = screen.getByText("Player 2").closest("button");
    expect(otherPlayerBtn).toBeDisabled();
  });

  it("shows anonymous vote preview dots based on received votes", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        votes: {
          "socket-123": "socket-456", // Me voted for Player 2
          "socket-789": "socket-456", // Player 3 voted for Player 2
          "socket-abc": "skip", // Another player voted skip
        },
      };
      return selector(state);
    });

    render(<VotingScreen />);

    // Player 2 should have 2 vote dots
    const player2Dots = screen.getAllByTestId("vote-dot-socket-456");
    expect(player2Dots).toHaveLength(2);

    // Skip vote should have 1 vote dot
    const skipDots = screen.getAllByTestId("vote-dot-skip");
    expect(skipDots).toHaveLength(1);

    // Player 3 should have 0 vote dots
    const player3Dots = screen.queryAllByTestId("vote-dot-socket-789");
    expect(player3Dots).toHaveLength(0);
  });

  it("shows the impostor guess form when the impostor can still guess", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        amIImpostor: true,
        gameOptions: {
          ...mockStateBase.gameOptions,
          impostorGuessEnabled: true,
        },
        actions: { ...mockStateBase.actions, submitImpostorGuess: vi.fn() },
      };
      return selector(state);
    });

    render(<VotingScreen />);

    expect(screen.getByText("Guess the secret word")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type the secret word..."),
    ).toBeInTheDocument();
  });

  it("hides the impostor guess form for non-impostors", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ ...mockStateBase }),
    );

    render(<VotingScreen />);

    expect(screen.queryByText("Guess the secret word")).not.toBeInTheDocument();
  });

  it("hides the impostor guess form once attempts are exhausted", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        amIImpostor: true,
        impostorGuessesUsed: 3,
        gameOptions: {
          ...mockStateBase.gameOptions,
          impostorGuessEnabled: true,
        },
      }),
    );

    render(<VotingScreen />);

    expect(screen.queryByText("Guess the secret word")).not.toBeInTheDocument();
  });
});
