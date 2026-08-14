import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UndoButton } from "../../../src/components/canvas/UndoButton";

describe("UndoButton", () => {
  it("calls onUndo when clicked", () => {
    const onUndo = vi.fn();
    render(<UndoButton onUndo={onUndo} />);

    fireEvent.click(screen.getByRole("button", { name: "Undo last stroke" }));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("is icon-only by default", () => {
    render(<UndoButton onUndo={vi.fn()} />);

    expect(screen.queryByText("Undo")).not.toBeInTheDocument();
    expect(screen.getByTestId("undo-stroke-btn")).toHaveClass("size-10");
  });

  it("shows its label when it is the only toolbar control", () => {
    render(<UndoButton onUndo={vi.fn()} showLabel />);

    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.getByTestId("undo-stroke-btn")).toHaveClass("h-10", "px-4");
  });
});
