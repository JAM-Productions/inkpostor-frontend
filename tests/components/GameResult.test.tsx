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

  const mockStateBase = {
    impostorId: "socket-456", // Player 2 is Impostor
    myId: "socket-123",
    hostId: "socket-123",
    players: [
      { id: "socket-123", name: "Host" },
      { id: "socket-456", name: "Impostor" },
      { id: "socket-789", name: "Player 3" },
    ],
    secretWord: "Pineapple",
    secretCategory: "Food",
    votes: {}, // To be populated in tests
    actions: { playAgain: mockPlayAgain },
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

    // Use getAllByText for 'Impostor' since it appears twice
    // (Once as ejected player, once as the inkpostor text)
    const impostorTexts = screen.getAllByText("Impostor");
    expect(impostorTexts).toHaveLength(2);

    expect(screen.getByText("Pineapple")).toBeInTheDocument();
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
    expect(screen.getByText("Player 3")).toBeInTheDocument(); // Ejected name
    expect(screen.getByText("Impostor")).toBeInTheDocument(); // Was the inkpostor
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
});
