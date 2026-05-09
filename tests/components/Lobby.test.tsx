import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Lobby } from "../../src/components/Lobby";
import { useGameStore } from "../../src/store/gameState";
import { useModalStore } from "../../src/store/modalStore";
import { ModalRenderer } from "../../src/components/modals/ModalRenderer";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("Lobby", () => {
  const mockStartGame = vi.fn();
  const mockUpdateGameOptions = vi.fn();

  const mockStateBase = {
    roomId: "TESTX9",
    myId: "socket-123",
    hostId: "socket-123",
    phase: "LOBBY",
    gameOptions: {
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: false,
    },
    actions: {
      startGame: mockStartGame,
      updateGameOptions: mockUpdateGameOptions,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modal store
    useModalStore.getState().actions.closeModal();
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
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("disables the copy button and shows placeholder when roomId is null", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, roomId: null, players: [] };
      return selector(state);
    });

    render(<Lobby />);

    const copyButton = screen.getByRole("button", {
      name: /Waiting for room code\.\.\./i,
    });
    expect(copyButton).toBeDisabled();
    expect(screen.getByText("------")).toBeInTheDocument();
    expect(copyButton).toHaveAttribute("title", "Waiting for room code...");
  });

  it("opens the rules modal when the how to play button is clicked", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, players: [] };
      return selector(state);
    });

    render(
      <>
        <Lobby />
        <ModalRenderer />
      </>,
    );

    const howToPlayBtn = screen.getByTestId("how-to-play-btn");
    await user.click(howToPlayBtn);

    expect(screen.getByText("How to Play Inkpostor")).toBeInTheDocument();
    expect(screen.getByText("Objective")).toBeInTheDocument();

    const closeBtn = screen.getByText("GOT IT!");
    await user.click(closeBtn);

    expect(screen.queryByText("How to Play Inkpostor")).not.toBeInTheDocument();
  });

  it("opens the options modal when the settings button is clicked", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, players: [] };
      return selector(state);
    });

    render(
      <>
        <Lobby />
        <ModalRenderer />
      </>,
    );

    const optionsButton = screen.getByRole("button", {
      name: /open options dialog/i,
    });
    await user.click(optionsButton);

    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByText("Drawing Time per Round")).toBeInTheDocument();
    expect(screen.getByText("Save Options")).toBeInTheDocument();
  });

  it("shows a badge with the number of non-default options", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameOptions: {
          roundTime: 25,
          unlimitedInk: true,
          clearCanvasEachRound: false,
        },
        players: [],
      };
      return selector(state);
    });

    render(<Lobby />);

    const optionsButton = screen.getByRole("button", {
      name: /open options dialog/i,
    });

    // The visual indicator is an amber dot (aria-hidden) inside the button
    const dot = optionsButton.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("bg-amber-400");
  });
});
