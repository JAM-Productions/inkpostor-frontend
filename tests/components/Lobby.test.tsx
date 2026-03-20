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
    expect(screen.getByText("lobby.waiting_players")).toBeInTheDocument();
    expect(
      screen.getByText("lobby.need_min"),
    ).toBeInTheDocument();

    // Start Game button should be disabled for the host
    const startButton = screen.getByRole("button", { name: /lobby\.start_game/i });
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
    const startButton = screen.getByRole("button", { name: /lobby\.start_game/i });
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
      screen.queryByRole("button", { name: /lobby\.start_game/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("lobby.waiting_host"),
    ).toBeInTheDocument();
  });

  it("copies the room code to clipboard when clicked", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, players: [] };
      return selector(state);
    });

    render(<Lobby />);

    const copyButton = screen.getByRole("button", { name: /TESTX9/i });
    await user.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith("TESTX9");
    expect(screen.getByText("lobby.copied")).toBeInTheDocument();
  });

  it("disables the copy button and shows placeholder when roomId is null", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, roomId: null, players: [] };
      return selector(state);
    });

    render(<Lobby />);

    const copyButton = screen.getByRole("button", {
      name: /lobby\.waiting_room_code/i,
    });
    expect(copyButton).toBeDisabled();
    expect(screen.getByText("------")).toBeInTheDocument();
    expect(copyButton).toHaveAttribute("title", "lobby.waiting_room_code");
  });

  it("opens the rules modal when the how to play button is clicked", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, players: [] };
      return selector(state);
    });

    render(<Lobby />);

    const howToPlayBtn = screen.getByTestId("how-to-play-btn");
    await user.click(howToPlayBtn);

    expect(screen.getByText("rules.title")).toBeInTheDocument();
    expect(screen.getByText("rules.objective.title")).toBeInTheDocument();

    const closeBtn = screen.getByText("rules.got_it");
    await user.click(closeBtn);

    expect(screen.queryByText("rules.title")).not.toBeInTheDocument();
  });
});
