import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TurnOrderSection } from "../../../../src/components/modals/options/TurnOrderSection";

describe("TurnOrderSection", () => {
  it("lets the host choose the turn order", () => {
    const onChange = vi.fn();
    render(
      <TurnOrderSection
        isHost
        onChange={onChange}
        turnOrderMode="RANDOM_STARTER"
      />,
    );

    fireEvent.click(
      screen.getByRole("radio", { name: /the full order is drawn again/i }),
    );
    expect(onChange).toHaveBeenCalledWith("RANDOM_ORDER");
  });

  it("shows the selected order without controls for guests", () => {
    render(
      <TurnOrderSection
        isHost={false}
        onChange={vi.fn()}
        turnOrderMode="FIXED_ORDER"
      />,
    );

    expect(screen.getByText("Fixed order")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });
});
