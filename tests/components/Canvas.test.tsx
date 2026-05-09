import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Canvas } from "../../src/components/Canvas";
import { useGameStore } from "../../src/store/gameState";
import type { StrokeData } from "../../src/store/gameState";
import { DEFAULT_ROUND_TIME } from "../../src/lib/constants";

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
      roundTime: DEFAULT_ROUND_TIME,
      unlimitedInk: false,
      clearCanvasEachRound: true,
    },
    players: [
      {
        id: "socket-123",
        name: "Host",
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
      },
      {
        id: "socket-456",
        name: "Player 2",
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
      },
    ],
    canvasStrokes: [] as StrokeData[],
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

  const mockStoreWithState = (state: any) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(state),
    );
  };

  it("renders my turn UI elements", () => {
    mockStore();

    render(<Canvas />);

    // Header
    expect(screen.getByText("Your turn!")).toBeInTheDocument();
    expect(screen.getAllByText("Host").length).toBeGreaterThan(0);

    // Should display time
    expect(screen.getByText(`${DEFAULT_ROUND_TIME}.0s`)).toBeInTheDocument();

    // Tools
    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
    expect(screen.getByText("Ink Supply")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
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

    // Initially ${DEFAULT_ROUND_TIME}.0s
    expect(screen.getByText(`${DEFAULT_ROUND_TIME}.0s`)).toBeInTheDocument();

    // Advance time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should now show ${DEFAULT_ROUND_TIME - 1}.0s
    expect(
      screen.getByText(`${DEFAULT_ROUND_TIME - 1}.0s`),
    ).toBeInTheDocument();
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

  it("does not allow undoing strokes that were already on the canvas before my turn", () => {
    const previousStroke = { x: 10, y: 10, color: "black", isNewStroke: true };
    mockStore({ canvasStrokes: [previousStroke] });

    render(<Canvas />);

    const undoBtn = screen.getByLabelText("Undo last stroke");
    expect(undoBtn).toBeDisabled();

    fireEvent.click(undoBtn);
    expect(mockUndoStroke).not.toHaveBeenCalled();
  });

  it("allows undo only after I add a stroke during my turn", () => {
    const previousStroke = { x: 10, y: 10, color: "black", isNewStroke: true };
    const myStroke = { x: 20, y: 20, color: "red", isNewStroke: true };
    const state = {
      ...mockStateBase,
      canvasStrokes: [previousStroke],
    };

    mockStoreWithState(state);
    const { rerender } = render(<Canvas />);

    expect(screen.getByLabelText("Undo last stroke")).toBeDisabled();

    state.canvasStrokes = [previousStroke, myStroke];
    rerender(<Canvas />);

    const undoBtn = screen.getByLabelText("Undo last stroke");
    expect(undoBtn).not.toBeDisabled();

    fireEvent.click(undoBtn);
    expect(mockUndoStroke).toHaveBeenCalledTimes(1);
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

  it("allows marking a player as suspicious from the player list popover", () => {
    mockStore({
      myId: "socket-123",
      currentTurnPlayerId: "socket-456",
    });

    render(<Canvas />);

    // Open the players list popover
    const playersBtn = screen.getByLabelText("Players list");
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

  it("hides ink meter and allows drawing without running out of ink when unlimitedInk is enabled", () => {
    mockStore({
      gameOptions: {
        roundTime: DEFAULT_ROUND_TIME,
        unlimitedInk: true,
        clearCanvasEachRound: true,
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

    expect(screen.queryByText("Ink Supply")).not.toBeInTheDocument();

    fireEvent.mouseDown(canvasElement, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(canvasElement, { clientX: 800, clientY: 600 });

    expect(screen.queryByText("OUT OF INK!")).not.toBeInTheDocument();
    expect(mockDrawStroke).toHaveBeenCalledTimes(2);
  });

  it("returns the ink meter to 100% after undoing the last stroke", () => {
    const state = {
      ...mockStateBase,
      canvasStrokes: [] as StrokeData[],
    };

    mockStoreWithState(state);

    const { container, rerender } = render(<Canvas />);
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

    fireEvent.mouseDown(canvasElement, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvasElement, { clientX: 11, clientY: 13 });

    state.canvasStrokes = [
      { x: 10, y: 10, color: "black", isNewStroke: true },
      { x: 11, y: 13, color: "black", isNewStroke: false },
    ];
    rerender(<Canvas />);

    fireEvent.click(screen.getByLabelText("Undo last stroke"));

    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
