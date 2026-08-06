import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OptionSwitch } from "../../../../src/components/modals/options/OptionSwitch";

describe("OptionSwitch", () => {
  it("delegates changes and exposes its current checked state", () => {
    const onChange = vi.fn();
    render(
      <OptionSwitch
        checked={false}
        disabled={false}
        label="Toggle option"
        onChange={onChange}
        tone="emerald"
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Toggle option" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("does not accept changes when disabled", () => {
    const onChange = vi.fn();
    render(
      <OptionSwitch
        checked
        disabled
        label="Toggle option"
        onChange={onChange}
        tone="pink"
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Toggle option" });
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
