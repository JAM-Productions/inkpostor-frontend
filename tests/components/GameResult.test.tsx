import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameResult } from "../../src/components/GameResult";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("GameResult", () => {
  const mockPlayAgain = vi.fn();
  const mockNextRound = vi.fn();

  const mockStateBase = {
    impostorId: "socket-456", // Player 2 is Impostor
    myId: "socket-123",
    hostId: "socket-123",
    players: [
      { id: "socket-123", name: "Host", hasConfirmedNewRound: false },
      { id: "socket-456", name: "Impostor", hasConfirmedNewRound: false },
      { id: "socket-789", name: "Player 3", hasConfirmedNewRound: false },
    ],
    secretWord: "Apple",
    secretCategory: "Food",
    votes: {}, // To be populated in tests
    actions: { playAgain: mockPlayAgain, nextRound: mockNextRound },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Impostor Defeated if impostor receives most votes", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        ejectedId: "socket-456",
        votes: {
          "socket-123": "socket-456", // Host votes Impostor
          "socket-789": "socket-456", // P3 votes Impostor
          "socket-456": "socket-789", // Impostor votes P3
        },
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Defeated")).toBeInTheDocument();

    expect(screen.getByText("Impostor was ejected.")).toBeInTheDocument();
    expect(screen.getByText("Impostor was the Inkpostor!")).toBeInTheDocument();

    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("shows Impostor Won if normal player receives most votes", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        ejectedId: "socket-789",
        players: [
          { id: "socket-123", name: "Host" },
          { id: "socket-456", name: "Impostor" },
          { id: "socket-789", name: "Player 3", isEjected: true },
        ],
        votes: {
          "socket-123": "socket-789", // Host votes P3
          "socket-456": "socket-789", // Impostor votes P3
        },
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Won")).toBeInTheDocument();
    expect(screen.getByText("Player 3 was ejected.")).toBeInTheDocument();
    expect(screen.getByText("Impostor was the Inkpostor!")).toBeInTheDocument();
  });

  it("shows Impostor Won when the impostor guessed the word, even after being ejected", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-456", // impostor was ejected...
        impostorGuessedCorrectly: true, // ...but guessed the word
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Won")).toBeInTheDocument();
    expect(screen.queryByText("Inkpostor Defeated")).not.toBeInTheDocument();
    expect(screen.getByText("Impostor guessed the word!")).toBeInTheDocument();
  });

  it("shows tie state if vote is tied", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        votes: {
          "socket-123": "socket-456", // Host votes Impostor
          "socket-456": "socket-789", // Impostor votes P3
        },
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Nobody was ejected...")).toBeInTheDocument();
  });

  it("allows host to play again", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        ejectedId: "socket-456",
        votes: { "socket-123": "socket-456" },
      };
      return selector(state);
    });

    render(<GameResult />);

    const playAgainBtn = screen.getByRole("button", { name: /play again/i });
    fireEvent.click(playAgainBtn);
    expect(mockPlayAgain).toHaveBeenCalled();
  });

  it("hides play again button for non-hosts", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        myId: "socket-456",
        ejectedId: "socket-456", // Impostor caught
        votes: { "socket-456": "socket-123" },
      }; // Not host
      return selector(state);
    });

    render(<GameResult />);

    expect(
      screen.queryByRole("button", { name: /play again/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Waiting for host to restart..."),
    ).toBeInTheDocument();
  });

  it("shows nobody ejected message when gameEnded is false and no ejectedId", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: null,
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Nobody was ejected...")).toBeInTheDocument();
  });

  it("shows was ejected message when gameEnded is false and ejectedId exists", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: "socket-789",
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Player 3 was ejected.")).toBeInTheDocument();
    expect(
      screen.getByText("Inkpostor is still among us..."),
    ).toBeInTheDocument();
  });

  it("shows Next Round button when game is not over and player hasn't confirmed", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: null,
      };
      return selector(state);
    });

    render(<GameResult />);

    const nextRoundBtn = screen.getByRole("button", { name: /next round/i });
    expect(nextRoundBtn).toBeInTheDocument();

    fireEvent.click(nextRoundBtn);
    expect(mockNextRound).toHaveBeenCalled();
  });

  it("hides Next Round button after nextRound is clicked", () => {
    const mockState = {
      ...mockStateBase,
      gameEnded: false,
      ejectedId: null,
      players: mockStateBase.players.map((player) => ({ ...player })),
    };

    mockState.actions = {
      ...mockState.actions,
      nextRound: vi.fn(() => {
        mockState.players = mockState.players.map((player) =>
          player.id === mockState.myId
            ? { ...player, hasConfirmedNewRound: true }
            : player,
        );
      }),
    };

    (useGameStore as any).mockImplementation((selector: any) =>
      selector(mockState),
    );

    const { rerender } = render(<GameResult />);

    const nextRoundBtn = screen.getByRole("button", { name: /next round/i });
    fireEvent.click(nextRoundBtn);
    rerender(<GameResult />);

    expect(
      screen.queryByRole("button", { name: /next round/i }),
    ).not.toBeInTheDocument();
  });

  it("shows waiting message when player has confirmed new round", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: null,
        players: [
          {
            id: "socket-123",
            name: "Host",
            hasConfirmedNewRound: true,
            isEjected: false,
            isConnected: true,
          },
          {
            id: "socket-456",
            name: "Impostor",
            hasConfirmedNewRound: false,
            isEjected: false,
            isConnected: true,
          },
          {
            id: "socket-789",
            name: "Player 3",
            hasConfirmedNewRound: false,
            isEjected: false,
            isConnected: true,
          },
        ],
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(
      screen.queryByRole("button", { name: /next round/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("1 of 3 players have confirmed to continue"),
    ).toBeInTheDocument();
  });

  it("renders Return to Home Screen button and clicking it triggers exitGame", () => {
    const mockExitGame = vi.fn();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        ejectedId: "socket-456",
        votes: { "socket-123": "socket-456" },
        actions: {
          ...mockStateBase.actions,
          exitGame: mockExitGame,
        },
      };
      return selector(state);
    });

    render(<GameResult />);

    const returnBtn = screen.getByTestId("return-home-button");
    expect(returnBtn).toBeInTheDocument();
    expect(screen.getByText("Return to Home Screen")).toBeInTheDocument();

    fireEvent.click(returnBtn);
    expect(mockExitGame).toHaveBeenCalled();
  });
});
