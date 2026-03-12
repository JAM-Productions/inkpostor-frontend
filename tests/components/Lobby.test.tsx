import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Lobby } from "../../src/components/Lobby";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("Lobby", () => {
  const mockStartGame = vi.fn();

  const mockStateBase = {
    roomId: "TESTX9",
    myId: "socket-123",
    hostId: "socket-123",
    actions: { startGame: mockStartGame },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the room code", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, players: [] };
      return selector(state);
    });

    render(<Lobby />);
    expect(screen.getByText("TESTX9")).toBeInTheDocument();
  });

  it("displays waiting for players when less than 3 players are joined", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Host Player" },
          { id: "socket-456", name: "Player 2" },
        ],
      };
      return selector(state);
    });

    render(<Lobby />);
    expect(screen.getByText("Waiting for more players...")).toBeInTheDocument();
    expect(
      screen.getByText("Need at least 3 players to start"),
    ).toBeInTheDocument();

    // Start Game button should be disabled for the host
    const startButton = screen.getByRole("button", { name: /start game/i });
    expect(startButton).toBeDisabled();
  });

  it("enables the start game button for the host when 3 or more players are joined", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Host Player" },
          { id: "socket-456", name: "Player 2" },
          { id: "socket-789", name: "Player 3" },
        ],
      };
      return selector(state);
    });

    render(<Lobby />);

    // Start Game button should be enabled
    const startButton = screen.getByRole("button", { name: /start game/i });
    expect(startButton).toBeEnabled();

    await user.click(startButton);
    expect(mockStartGame).toHaveBeenCalled();
  });

  it("shows waiting message instead of start button for non-hosts", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        myId: "socket-456", // Not the host
        players: [
          { id: "socket-123", name: "Host Player" },
          { id: "socket-456", name: "Player 2" },
          { id: "socket-789", name: "Player 3" },
        ],
      };
      return selector(state);
    });

    render(<Lobby />);

    expect(
      screen.queryByRole("button", { name: /start game/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Waiting for host to start..."),
    ).toBeInTheDocument();
  });
});
