import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CanvasPreviewLegend } from "../../../src/components/canvas/CanvasPreviewLegend";
import { useGameStore } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("CanvasPreviewLegend", () => {
  const mockOnIsolate = vi.fn();

  const mockState = {
    hostId: "host-1",
    players: [
      { id: "host-1", name: "Host" },
      { id: "p2", name: "Player 2" },
    ],
  };

  const renderLegend = (props: Record<string, unknown> = {}) =>
    render(
      <CanvasPreviewLegend
        authorIds={["host-1", "p2"]}
        hasUnknown={false}
        currentAuthorId={null}
        isolatedPlayerId={null}
        isPlaying={false}
        onIsolate={mockOnIsolate}
        {...props}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(mockState),
    );
  });

  it("lists everyone who drew, in the order they took their turn", () => {
    renderLegend();

    const legend = screen.getByTestId("canvas-preview-legend");
    expect(legend).toHaveTextContent("Host");
    expect(legend).toHaveTextContent("Player 2");
  });

  it("singles a player out on the first tap and lets them go on the second", () => {
    const { rerender } = renderLegend();

    fireEvent.click(screen.getByTestId("preview-author-p2"));
    expect(mockOnIsolate).toHaveBeenCalledWith("p2");

    rerender(
      <CanvasPreviewLegend
        authorIds={["host-1", "p2"]}
        hasUnknown={false}
        currentAuthorId={null}
        isolatedPlayerId="p2"
        isPlaying={false}
        onIsolate={mockOnIsolate}
      />,
    );

    fireEvent.click(screen.getByTestId("preview-author-p2"));
    expect(mockOnIsolate).toHaveBeenLastCalledWith(null);
  });

  it("marks the singled out player, and stands the others back", () => {
    renderLegend({ isolatedPlayerId: "p2" });

    expect(screen.getByTestId("preview-author-p2")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("preview-author-host-1")).toHaveClass(
      "text-amber-100/40",
    );
  });

  it("takes no clicks while the replay is still running", () => {
    renderLegend({ isPlaying: true, currentAuthorId: "host-1" });

    fireEvent.click(screen.getByTestId("preview-author-p2"));

    expect(mockOnIsolate).not.toHaveBeenCalled();
  });

  it("follows the replay, marking whoever is drawing", () => {
    renderLegend({ isPlaying: true, currentAuthorId: "host-1" });

    expect(screen.getByTestId("preview-author-host-1")).toHaveClass(
      "border-amber-400",
    );
    expect(screen.getByTestId("preview-author-p2")).not.toHaveClass(
      "border-amber-400",
    );
  });

  it("names a player who has since left the room", () => {
    renderLegend({ authorIds: ["host-1", "gone"] });

    expect(screen.getByTestId("preview-author-gone")).toHaveTextContent(
      "Unknown",
    );
  });

  it("accounts for the part of the drawing nobody can be credited with", () => {
    renderLegend({ hasUnknown: true });

    // A card, but not a handle: there is nothing to isolate about "we don't know".
    const unknown = screen.getByTestId("preview-author-unknown");
    expect(unknown).toHaveTextContent("Unknown");
    expect(unknown.tagName).toBe("DIV");
  });
});
