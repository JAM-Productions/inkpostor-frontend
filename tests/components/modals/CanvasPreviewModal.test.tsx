import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CanvasPreviewModal } from "../../../src/components/modals/CanvasPreviewModal";
import { useGameStore, type StrokeData } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

/**
 * The rounds side of the preview. A canvas the host chose to keep between
 * rounds holds all of them at once, so the modal has to break it back apart.
 */
describe("CanvasPreviewModal rounds", () => {
  const players = [
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
  ];

  const point = (
    x: number,
    stamp?: { playerId: string; round: number },
  ): StrokeData => ({
    x,
    y: x,
    color: "#000",
    isNewStroke: x === 0,
    ...stamp,
  });

  const renderModal = (canvasStrokes: StrokeData[]) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ canvasStrokes, players, hostId: "alice" }),
    );
    return render(<CanvasPreviewModal isOpen={true} onClose={vi.fn()} />);
  };

  // Round 1 is Alice's, round 2 is Bob's, on one canvas that was never wiped.
  const twoRounds = [
    point(0, { playerId: "alice", round: 1 }),
    point(1),
    point(2, { playerId: "bob", round: 2 }),
    point(3),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leaves the selector out when the canvas holds a single round", () => {
    renderModal([point(0, { playerId: "alice", round: 1 }), point(1)]);

    expect(
      screen.queryByTestId("canvas-round-selector"),
    ).not.toBeInTheDocument();
  });

  it("offers every round the canvas holds", () => {
    renderModal(twoRounds);

    expect(screen.getByTestId("canvas-round-selector")).toBeInTheDocument();
    expect(screen.getByTestId("preview-round-1")).toBeInTheDocument();
    expect(screen.getByTestId("preview-round-2")).toBeInTheDocument();
  });

  it("opens on the newest round", () => {
    renderModal(twoRounds);

    expect(screen.getByTestId("canvas-round-current")).toHaveTextContent(
      "Round 2",
    );
    expect(screen.getByTestId("preview-round-2")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("walks the rounds with the arrows, wrapping at the ends", () => {
    renderModal(twoRounds);

    fireEvent.click(screen.getByLabelText("Previous round"));
    expect(screen.getByTestId("canvas-round-current")).toHaveTextContent(
      "Round 1",
    );

    // Past the oldest is the newest again, the way the mode carousel goes.
    fireEvent.click(screen.getByLabelText("Previous round"));
    expect(screen.getByTestId("canvas-round-current")).toHaveTextContent(
      "Round 2",
    );

    fireEvent.click(screen.getByLabelText("Next round"));
    expect(screen.getByTestId("canvas-round-current")).toHaveTextContent(
      "Round 1",
    );
  });

  it("shows only the players who drew in the round on show", () => {
    renderModal(twoRounds);

    // Bob drew round 2, Alice did not.
    expect(screen.getByTestId("preview-author-bob")).toBeInTheDocument();
    expect(
      screen.queryByTestId("preview-author-alice"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("preview-round-1"));

    expect(screen.getByTestId("preview-author-alice")).toBeInTheDocument();
    expect(screen.queryByTestId("preview-author-bob")).not.toBeInTheDocument();
  });

  it("stays on the newest round as the rounds go by", () => {
    const { rerender } = renderModal(twoRounds);

    // A third round lands while the modal is open, and nobody has chosen a
    // round by hand: the newest is still what should be on show.
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        canvasStrokes: [
          ...twoRounds,
          point(4, { playerId: "alice", round: 3 }),
        ],
        players,
        hostId: "alice",
      }),
    );
    rerender(<CanvasPreviewModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("canvas-round-current")).toHaveTextContent(
      "Round 3",
    );
  });
});
