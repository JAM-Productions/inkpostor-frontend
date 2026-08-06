import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClearCanvasSection } from "../../../../src/components/modals/options/ClearCanvasSection";

describe("ClearCanvasSection", () => {
  it("lets the host change the setting when the mode does not lock it", () => {
    const onChange = vi.fn();
    render(
      <ClearCanvasSection
        checked={false}
        isHost
        isLocked={false}
        modeName="Classic"
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("switch", { name: /toggle canvas clearing/i }),
    );
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("replaces the switch with a lock and explanation when required by the mode", () => {
    render(
      <ClearCanvasSection
        checked
        isHost
        isLocked
        modeName="Hot Word"
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("switch", { name: /toggle canvas clearing/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("clear-canvas-locked")).toBeInTheDocument();
    expect(screen.getByTestId("clear-canvas-locked-notice")).toHaveTextContent(
      "Hot Word",
    );
  });
});
