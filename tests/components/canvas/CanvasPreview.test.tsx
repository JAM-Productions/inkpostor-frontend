import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CanvasPreview } from "../../../src/components/canvas/CanvasPreview";
import { useGameStore } from "../../../src/store/gameState";
import type { StrokeData } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("CanvasPreview", () => {
  const mockStore = (canvasStrokes: StrokeData[] | undefined) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ canvasStrokes }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the canvas with its label", () => {
    mockStore([{ x: 1, y: 2, color: "#000000", isNewStroke: true }]);

    const { container } = render(<CanvasPreview />);

    expect(screen.getByText("The drawing")).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(screen.queryByText("Nothing was drawn")).not.toBeInTheDocument();
  });

  it("hides the label when asked to", () => {
    mockStore([{ x: 1, y: 2, color: "#000000", isNewStroke: true }]);

    render(<CanvasPreview showLabel={false} />);

    expect(screen.queryByText("The drawing")).not.toBeInTheDocument();
  });

  it("shows a placeholder when nothing was drawn", () => {
    mockStore([]);

    render(<CanvasPreview />);

    expect(screen.getByText("Nothing was drawn")).toBeInTheDocument();
  });

  it("survives a state where the strokes have not arrived yet", () => {
    mockStore(undefined);

    render(<CanvasPreview />);

    expect(screen.getByText("Nothing was drawn")).toBeInTheDocument();
  });
});
