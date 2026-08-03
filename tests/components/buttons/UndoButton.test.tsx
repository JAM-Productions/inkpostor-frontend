import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UndoButton } from "../../../src/components/buttons/UndoButton";

describe("UndoButton", () => {
  it("renders with default props correctly", () => {
    const onClick = vi.fn();
    render(<UndoButton onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Undo last stroke" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("size-10");
    expect(screen.queryByText("Undo")).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<UndoButton onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Undo last stroke" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders with isUndoOnly as true correctly", () => {
    const onClick = vi.fn();
    render(<UndoButton onClick={onClick} isUndoOnly={true} />);

    const button = screen.getByRole("button", { name: "Undo last stroke" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("px-4");
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });
});
