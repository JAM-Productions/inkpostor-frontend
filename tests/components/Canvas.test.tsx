import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Canvas } from "../../src/components/Canvas";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("Canvas", () => {
  const mockEndTurn = vi.fn();
  const mockClearCanvas = vi.fn();
  const mockDrawStroke = vi.fn();

  const mockStateBase = {
    myId: "socket-123",
    currentTurnPlayerId: "socket-123", // I am the active player
    players: [
      { id: "socket-123", name: "Host" },
      { id: "socket-456", name: "Player 2" },
    ],
    canvasStrokes: [],
    actions: {
      endTurn: mockEndTurn,
      clearCanvas: mockClearCanvas,
      drawStroke: mockDrawStroke,
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
    expect(screen.getByText("Host")).toBeInTheDocument();

    // Should display time
    expect(screen.getByText("15.0s")).toBeInTheDocument();

    // Tools
    expect(screen.getByTitle("Eraser")).toBeInTheDocument();
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
    expect(screen.getByText("Host")).toBeInTheDocument();

    // Shouldn't see tools
    expect(screen.queryByTitle("Eraser")).not.toBeInTheDocument();
    expect(screen.queryByText("Ink Supply")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /done/i }),
    ).not.toBeInTheDocument();
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

  it("clicking the Eraser button sets the color but does NOT call clearCanvas", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<Canvas />);

    const eraserBtn = screen.getByTitle("Eraser");
    fireEvent.click(eraserBtn);

    // Should not clear everything
    expect(mockClearCanvas).not.toHaveBeenCalled();

    // Verify it is active (has the active classes)
    expect(eraserBtn).toHaveClass("bg-white", "text-stone-900", "scale-110");
  });

  it("resets to default color at the start of a new turn", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    const { rerender } = render(<Canvas />);

    // Select Eraser
    const eraserBtn = screen.getByTitle("Eraser");
    fireEvent.click(eraserBtn);
    expect(eraserBtn).toHaveClass("bg-white");

    // Simulate turn ending and starting again (rerender with same state to trigger effect if dependency changed,
    // but here the reset logic is in useEffect dependency on isMyTurn).
    // Actually, our reset logic is: useEffect(() => { if (isMyTurn) { setColor("#1a1a1a"); ... } }, [isMyTurn, actions]);
    // So we need to toggle isMyTurn from false to true.

    // 1. Not my turn
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, myId: "socket-456" };
      return selector(state);
    });
    rerender(<Canvas />);
    expect(screen.queryByTitle("Eraser")).not.toBeInTheDocument();

    // 2. My turn starts
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, myId: "socket-123" };
      return selector(state);
    });
    rerender(<Canvas />);

    // Should be reset to default (not white background on eraser button)
    const newEraserBtn = screen.getByTitle("Eraser");
    expect(newEraserBtn).not.toHaveClass("bg-white");
    expect(newEraserBtn).toHaveClass("bg-stone-700");
  });
});
