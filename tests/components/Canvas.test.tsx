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
  const mockUndoStroke = vi.fn();
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
      undoStroke: mockUndoStroke,
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
    expect(screen.getByTitle("Undo Last Stroke")).toBeInTheDocument();
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
    expect(screen.queryByTitle("Undo Last Stroke")).not.toBeInTheDocument();
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

  it("button is present", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<Canvas />);

    const undoBtn = screen.getByTitle("Undo Last Stroke");
    expect(undoBtn).toBeInTheDocument();
  });
});
