import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Canvas } from "../src/components/Canvas";
import { useGameStore } from "../src/store/gameState";
import React from "react";

vi.mock("../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("Canvas Ink Consumption", () => {
  const mockDrawStroke = vi.fn();
  const mockEndTurn = vi.fn();

  const mockStateBase = {
    myId: "me",
    currentTurnPlayerId: "me",
    players: [{ id: "me", name: "Me" }],
    canvasStrokes: [],
    secretWord: "Apple",
    secretCategory: "Fruit",
    amIImpostor: false,
    actions: {
      drawStroke: mockDrawStroke,
      endTurn: mockEndTurn,
      clearCanvas: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) => selector(mockStateBase));

    // Mock getBoundingClientRect for canvas
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
    })) as any;

    // Mock getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    })) as any;
  });

  it("consumes ink when a dot is drawn (mousedown)", () => {
    render(<Canvas />);

    // Initial ink should be 100%
    expect(screen.getByText("100%")).toBeInTheDocument();

    const canvas = document.querySelector('canvas')!;

    // Simulate mousedown (startDrawing)
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    // Ink percentage should decrease.
    // MAX_INK = 1000, MIN_INK_FOR_DOT = 2.
    // inkUsed = 2. inkPercentage = (2 / 1000) * 100 = 0.2.
    // Displayed: Math.floor(100 - 0.2) = 99%
    expect(screen.getByText("99%")).toBeInTheDocument();
    expect(mockDrawStroke).toHaveBeenCalledWith(expect.objectContaining({
        isNewStroke: true
    }));
  });

  it("displays secret word and category", () => {
      render(<Canvas />);
      expect(screen.getByText("Fruit")).toBeInTheDocument();
      expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("displays Impostor message for impostor", () => {
      (useGameStore as any).mockImplementation((selector: any) => selector({
          ...mockStateBase,
          amIImpostor: true,
          secretWord: null
      }));
      render(<Canvas />);
      expect(screen.getByText("You are the Inkpostor!")).toBeInTheDocument();
  });
});
