import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OptionsFooter } from "../../../../src/components/modals/options/OptionsFooter";

describe("OptionsFooter", () => {
  it("delegates confirmation and reset independently", () => {
    const onConfirm = vi.fn();
    const onReset = vi.fn();
    render(<OptionsFooter onConfirm={onConfirm} onReset={onReset} />);

    fireEvent.click(screen.getByTestId("confirm-options-button"));
    fireEvent.click(screen.getByTestId("reset-options-button"));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
