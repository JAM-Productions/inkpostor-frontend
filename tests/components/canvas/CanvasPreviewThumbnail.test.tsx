import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CanvasPreviewThumbnail } from "../../../src/components/canvas/CanvasPreviewThumbnail";
import { useGameStore } from "../../../src/store/gameState";
import { useModalStore } from "../../../src/store/modalStore";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

vi.mock("../../../src/store/modalStore", () => ({
  useModalStore: vi.fn(),
}));

describe("CanvasPreviewThumbnail", () => {
  const mockOpenModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        canvasStrokes: [{ x: 10, y: 10, color: "#000000", isNewStroke: true }],
      }),
    );
    (useModalStore as any).mockImplementation((selector: any) =>
      selector({ actions: { openModal: mockOpenModal } }),
    );
  });

  it("opens the canvas preview modal when tapped", () => {
    render(<CanvasPreviewThumbnail />);

    fireEvent.click(screen.getByRole("button", { name: "View drawing" }));

    expect(mockOpenModal).toHaveBeenCalledWith("CANVAS_PREVIEW");
  });

  it("renders the preview without its caption", () => {
    render(<CanvasPreviewThumbnail />);

    expect(screen.getByTestId("canvas-preview")).toBeInTheDocument();
    expect(screen.queryByText("The drawing")).not.toBeInTheDocument();
  });
});
