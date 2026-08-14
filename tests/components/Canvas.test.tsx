import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Canvas } from "../../src/components/Canvas";
import { useGameStore } from "../../src/store/gameState";
import { DEFAULT_CANVAS_COLOR } from "../../src/lib/canvasColors";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("Canvas", () => {
  const mockEndTurn = vi.fn();
  const mockUndoStroke = vi.fn();
  const mockDrawStroke = vi.fn();
  const mockToggleSus = vi.fn();

  const mockStateBase = {
    myId: "socket-123",
    currentTurnPlayerId: "socket-123", // I am the active player
    hostId: "socket-123",
    isMobile: false,
    gameOptions: {
      roundTime: 20,
      unlimitedInk: false,
      clearCanvasEachRound: false,
    },
    players: [
      {
        id: "socket-123",
        name: "Host",
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
        isConnected: true,
      },
      {
        id: "socket-456",
        name: "Player 2",
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
        isConnected: true,
      },
    ],
    canvasStrokes: [],
    kickVotes: {},
    actions: {
      endTurn: mockEndTurn,
      undoStroke: mockUndoStroke,
      drawStroke: mockDrawStroke,
      toggleSus: mockToggleSus,
      startEmergencyVoting: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Mock HTMLCanvasElement since jsdom doesn't support getContext fully
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
    })) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        ...overrides,
      };
      return selector(state);
    });
  };

  it("renders my turn UI elements", () => {
    mockStore();

    render(<Canvas />);

    // Header
    expect(screen.getByText("Your turn!")).toBeInTheDocument();

    // Should display time
    expect(screen.getByTestId("timer")).toHaveTextContent("20.0");

    // Tools
    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
    expect(screen.getByText("Ink Supply")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
  });

  it("toggles the impostor guess panel and closes it when clicking outside", () => {
    mockStore({
      myId: "socket-456",
      amIImpostor: true,
      impostorGuessesUsed: 0,
      gameOptions: {
        ...mockStateBase.gameOptions,
        impostorGuessEnabled: true,
        impostorGuessAttempts: 3,
      },
      actions: { ...mockStateBase.actions, submitImpostorGuess: vi.fn() },
    });

    render(<Canvas />);

    const guessButton = screen.getByRole("button", { name: /guess word/i });

    // Opens on click
    fireEvent.click(guessButton);
    expect(screen.getByText("Guess the secret word")).toBeInTheDocument();

    // Closes when clicking elsewhere inside the banner (e.g. the active player label)
    fireEvent.mouseDown(screen.getByText("Now Drawing"));
    expect(screen.queryByText("Guess the secret word")).not.toBeInTheDocument();

    // Reopen, then close by clicking fully outside the banner
    fireEvent.click(guessButton);
    expect(screen.getByText("Guess the secret word")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Guess the secret word")).not.toBeInTheDocument();
  });

  it("renders waiting UI for non-active players", () => {
    mockStore({ myId: "socket-456" });

    render(<Canvas />);

    // Header
    expect(screen.getByText("Now Drawing")).toBeInTheDocument();
    expect(screen.getAllByText("Host").length).toBeGreaterThan(0);

    // Shouldn't see tools
    expect(screen.queryByLabelText("Undo last stroke")).not.toBeInTheDocument();
    expect(screen.queryByText("Ink Supply")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /done/i }),
    ).not.toBeInTheDocument();
  });

  it("timer decrements for non-active players too", () => {
    mockStore({ myId: "socket-456" });

    render(<Canvas />);

    // Initially 20.0s
    expect(screen.getByTestId("timer")).toHaveTextContent("20.0");

    // Advance time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should now show 19.0s
    expect(screen.getByTestId("timer")).toHaveTextContent("19.0");
  });

  it("allows active player to end turn manually", () => {
    mockStore();

    render(<Canvas />);

    const doneBtn = screen.getByRole("button", { name: /done/i });
    fireEvent.click(doneBtn);
    expect(mockEndTurn).toHaveBeenCalled();
  });

  it("button is present", () => {
    mockStore();

    render(<Canvas />);

    const undoBtn = screen.getByLabelText("Undo last stroke");
    expect(undoBtn).toBeInTheDocument();
  });

  it("can toggle toolbar compression", () => {
    mockStore();

    render(<Canvas />);

    // Initially expanded
    expect(screen.getByLabelText("Compress toolbar")).toBeInTheDocument();

    // Toggle compression
    fireEvent.click(screen.getByLabelText("Compress toolbar"));

    // Now compressed
    expect(screen.queryByLabelText("Compress toolbar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Expand toolbar")).toBeInTheDocument();

    // Toggle back
    fireEvent.click(screen.getByLabelText("Expand toolbar"));
    expect(screen.getByLabelText("Compress toolbar")).toBeInTheDocument();
  });

  it("hides the ink meter and compress button when unlimited ink is enabled", () => {
    mockStore({
      gameOptions: {
        ...mockStateBase.gameOptions,
        unlimitedInk: true,
      },
    });

    render(<Canvas />);

    expect(screen.queryByText("Ink Supply")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Compress toolbar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
  });

  it("allows marking a player as suspicious from the player list popover", () => {
    mockStore({
      myId: "socket-123",
      currentTurnPlayerId: "socket-456",
    });

    render(<Canvas />);

    // Open the players list popover
    const playersBtn = screen.getByLabelText("Players");
    fireEvent.click(playersBtn);

    // Find Player 2 in the list and click it
    const player2Btn = screen.getByTitle("Player 2");
    fireEvent.click(player2Btn);

    expect(mockToggleSus).toHaveBeenCalledWith("socket-456");
  });

  it("displays big Out of Ink message when ink is exhausted", () => {
    mockStore();

    const { container } = render(<Canvas />);

    // To reach MAX_INK, we need to draw.
    const canvasElement = container.querySelector("canvas")!;

    // We need to mock getBoundingClientRect for the coordinate calculation
    canvasElement.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
    })) as any;

    // Start drawing
    fireEvent.mouseDown(canvasElement, { clientX: 0, clientY: 0 });

    // Move a lot to consume ink (MAX_INK is 1000)
    // Distance formula: sqrt((x2-x1)^2 + (y2-y1)^2)
    // From 0,0 to 800,600 is sqrt(800^2 + 600^2) = 1000.
    // However, the component also adds DOT_INK_COST (5) on mouseDown.
    // So 1000 + 5 would definitely exceed 1000.

    // We also need to mock the width/height on the element directly because of the useEffect resize
    Object.defineProperty(canvasElement, "width", { value: 800 });
    Object.defineProperty(canvasElement, "height", { value: 600 });

    fireEvent.mouseMove(canvasElement, { clientX: 800, clientY: 600 });

    // Now it should be out of ink
    expect(screen.getAllByText("OUT OF INK!").length).toBeGreaterThan(0);

    // Check for the big indicator specifically (the one with large text classes)
    const outOfInkElements = screen.getAllByText("OUT OF INK!");
    const bigIndicator = outOfInkElements.find(
      (el) =>
        el.className.includes("text-4xl") || el.className.includes("text-6xl"),
    );
    expect(bigIndicator).toBeInTheDocument();
  });

  it("does not run out of ink when unlimited ink is enabled", () => {
    mockStore({
      gameOptions: {
        ...mockStateBase.gameOptions,
        unlimitedInk: true,
      },
    });

    const { container } = render(<Canvas />);
    const canvasElement = container.querySelector("canvas")!;

    canvasElement.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
    })) as any;

    Object.defineProperty(canvasElement, "width", { value: 800 });
    Object.defineProperty(canvasElement, "height", { value: 600 });

    fireEvent.mouseDown(canvasElement, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(canvasElement, { clientX: 800, clientY: 600 });

    expect(screen.queryByText("OUT OF INK!")).not.toBeInTheDocument();
    expect(mockDrawStroke).toHaveBeenNthCalledWith(1, {
      x: 0,
      y: 0,
      color: DEFAULT_CANVAS_COLOR,
      isNewStroke: true,
    });
    expect(mockDrawStroke).toHaveBeenNthCalledWith(2, {
      x: 800,
      y: 600,
      color: DEFAULT_CANVAS_COLOR,
      isNewStroke: false,
    });
  });

  describe("active player connection status", () => {
    it("displays active player's initial letter and 'Now Drawing' when active player is connected (not my turn)", () => {
      mockStore({
        myId: "socket-123",
        currentTurnPlayerId: "socket-456",
        players: [
          {
            id: "socket-123",
            name: "Host",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: true,
          },
          {
            id: "socket-456",
            name: "Player 2",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: true,
          },
        ],
      });

      const { container } = render(<Canvas />);

      // Active player is Player 2. Since they are connected, their name's initial "P" is rendered.
      expect(screen.getByText("P")).toBeInTheDocument();

      // The status text should display "Now Drawing".
      const statusText = screen.getByText("Now Drawing");
      expect(statusText).toBeInTheDocument();
      expect(statusText).not.toHaveClass("animate-pulse");

      // No spinner loader should be visible.
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    });

    it("displays loader spinner and 'Offline' status with pulse animation when active player is disconnected (not my turn)", () => {
      mockStore({
        myId: "socket-123",
        currentTurnPlayerId: "socket-456",
        players: [
          {
            id: "socket-123",
            name: "Host",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: true,
          },
          {
            id: "socket-456",
            name: "Player 2",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: false, // Disconnected player
          },
        ],
      });

      const { container } = render(<Canvas />);

      // Since Player 2 is disconnected, their initial letter "P" should NOT be rendered.
      expect(screen.queryByText("P")).not.toBeInTheDocument();

      // The status text should display "Offline" (canvas.notConnected).
      const statusText = screen.getByText("Offline");
      expect(statusText).toBeInTheDocument();
      expect(statusText).toHaveClass("animate-pulse");

      // Spinner loader overlay should be visible.
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("displays 'Your turn!' and correct UI when active player is connected (my turn)", () => {
      mockStore({
        myId: "socket-123",
        currentTurnPlayerId: "socket-123",
        players: [
          {
            id: "socket-123",
            name: "Host",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: true,
          },
          {
            id: "socket-456",
            name: "Player 2",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: true,
          },
        ],
      });

      const { container } = render(<Canvas />);

      // Since it's my turn and I'm connected, my initial letter "H" should be rendered.
      expect(screen.getByText("H")).toBeInTheDocument();

      // My turn status should show "Your turn!"
      expect(screen.getByText("Your turn!")).toBeInTheDocument();

      // No spinner loader should be visible.
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    });

    it("displays 'Your turn!' but overlays spinner when my turn and I am disconnected", () => {
      mockStore({
        myId: "socket-123",
        currentTurnPlayerId: "socket-123",
        players: [
          {
            id: "socket-123",
            name: "Host",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: false, // I am disconnected
          },
          {
            id: "socket-456",
            name: "Player 2",
            isSuspected: false,
            isEjected: false,
            hasStartedEmergencyVoting: false,
            isConnected: true,
          },
        ],
      });

      const { container } = render(<Canvas />);

      // Since I'm disconnected, my initial letter "H" should NOT be rendered.
      expect(screen.queryByText("H")).not.toBeInTheDocument();

      // My turn status should still show "Your turn!"
      expect(screen.getByText("Your turn!")).toBeInTheDocument();

      // Spinner loader overlay should be visible.
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });
});
