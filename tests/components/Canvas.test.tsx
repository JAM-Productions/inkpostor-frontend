import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Canvas } from "../../src/components/Canvas";
import { useGameStore } from "../../src/store/gameState";

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
    players: [
      { id: "socket-123", name: "Host", isSuspected: false },
      { id: "socket-456", name: "Player 2", isSuspected: false },
    ],
    canvasStrokes: [],
    actions: {
      endTurn: mockEndTurn,
      undoStroke: mockUndoStroke,
      drawStroke: mockDrawStroke,
      toggleSus: mockToggleSus,
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

  it("renders my turn UI elements", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<Canvas />);

    // Header
    expect(screen.getByText("Your turn!")).toBeInTheDocument();
    expect(screen.getAllByText("Host").length).toBeGreaterThan(0);

    // Should display time
    expect(screen.getByText("20.0s")).toBeInTheDocument();

    // Tools
    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
    expect(screen.getByText("Ink Supply")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
  });

  it("renders waiting UI for non-active players", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, myId: "socket-456" }; // Not me
      return selector(state);
    });

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
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, myId: "socket-456" }; // Not me
      return selector(state);
    });

    render(<Canvas />);

    // Initially 20.0s
    expect(screen.getByText("20.0s")).toBeInTheDocument();

    // Advance time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should now show 19.0s
    expect(screen.getByText("19.0s")).toBeInTheDocument();
  });

  it("allows active player to end turn manually", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<Canvas />);

    const doneBtn = screen.getByRole("button", { name: /done/i });
    fireEvent.click(doneBtn);
    expect(mockEndTurn).toHaveBeenCalled();
  });

  it("button is present", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<Canvas />);

    const undoBtn = screen.getByLabelText("Undo last stroke");
    expect(undoBtn).toBeInTheDocument();
  });

  it("can toggle toolbar compression", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

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

  it("allows marking a player as suspicious from the player list", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<Canvas />);

    // Find Player 2 in the list and click it
    const player2Btn = screen.getByRole("button", { name: /player 2/i });
    fireEvent.click(player2Btn);

    expect(mockToggleSus).toHaveBeenCalledWith("socket-456");
  });

  it("allows marking the current drawer as sus from the header", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      // It's Player 2's turn, not mine
      const state = {
        ...mockStateBase,
        myId: "socket-123",
        currentTurnPlayerId: "socket-456",
      };
      return selector(state);
    });

    render(<Canvas />);

    // Header should have a mark as sus button
    const markSusBtn = screen.getByRole("button", { name: /mark as sus/i });
    fireEvent.click(markSusBtn);

    expect(mockToggleSus).toHaveBeenCalledWith("socket-456");
  });

  it("displays big Out of Ink message when ink is exhausted", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

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
});
