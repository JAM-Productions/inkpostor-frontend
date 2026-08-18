import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { DrawingCanvas } from "../../../src/components/canvas/DrawingCanvas";
import { useTurnTimerStore } from "../../../src/store/turnTimerStore";

describe("DrawingCanvas", () => {
  const renderCanvas = (
    props: Partial<React.ComponentProps<typeof DrawingCanvas>> = {},
  ) => {
    const defaultProps: React.ComponentProps<typeof DrawingCanvas> = {
      canvasRef: createRef<HTMLCanvasElement>(),
      containerRef: createRef<HTMLDivElement>(),
      isMyTurn: true,
      isOutOfInk: false,
      onStartDrawing: vi.fn(),
    };
    return render(<DrawingCanvas {...defaultProps} {...props} />);
  };

  it("calls onStartDrawing on mouse and touch start", () => {
    const onStartDrawing = vi.fn();
    const { container } = renderCanvas({ onStartDrawing });
    const canvas = container.querySelector("canvas")!;

    fireEvent.mouseDown(canvas);
    fireEvent.touchStart(canvas);

    expect(onStartDrawing).toHaveBeenCalledTimes(2);
  });

  it("shows the big OUT OF INK overlay only on my turn while out of ink", () => {
    renderCanvas({ isMyTurn: true, isOutOfInk: true });
    expect(screen.getByText("OUT OF INK!")).toBeInTheDocument();
  });

  it("hides the overlay when not out of ink", () => {
    renderCanvas({ isMyTurn: true, isOutOfInk: false });
    expect(screen.queryByText("OUT OF INK!")).not.toBeInTheDocument();
  });

  it("hides the overlay when it is not my turn", () => {
    renderCanvas({ isMyTurn: false, isOutOfInk: true });
    expect(screen.queryByText("OUT OF INK!")).not.toBeInTheDocument();
  });

  it("uses a crosshair cursor only when drawing is allowed", () => {
    const { container, rerender } = renderCanvas({
      isMyTurn: true,
      isOutOfInk: false,
    });
    expect(container.querySelector("canvas")!.className).toContain(
      "cursor-crosshair",
    );

    rerender(
      <DrawingCanvas
        canvasRef={createRef<HTMLCanvasElement>()}
        containerRef={createRef<HTMLDivElement>()}
        isMyTurn={false}
        isOutOfInk={false}
        onStartDrawing={vi.fn()}
      />,
    );
    expect(container.querySelector("canvas")!.className).toContain(
      "cursor-not-allowed",
    );
  });

  it("renders the floating timer with the remaining seconds", () => {
    useTurnTimerStore.setState({ timeLeftMs: 5300 });
    renderCanvas();
    expect(screen.getByText("5.3")).toBeInTheDocument();
  });
});
