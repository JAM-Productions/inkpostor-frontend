import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ImpostorCountSection } from "../components/modals/options/ImpostorCountSection";

describe("ImpostorCountSection component", () => {
  it("renders count and controls with max limit", () => {
    const onCountChange = vi.fn();
    const onRevealTeammatesChange = vi.fn();
    render(
      <ImpostorCountSection
        count={1}
        maxImpostors={3}
        revealTeammates={true}
        isHost={true}
        onCountChange={onCountChange}
        onRevealTeammatesChange={onRevealTeammatesChange}
      />,
    );

    expect(screen.getByTestId("impostor-count-value")).toHaveTextContent("1");
    const decreaseBtn = screen.getByTestId("decrease-impostors-btn");
    const increaseBtn = screen.getByTestId("increase-impostors-btn");

    expect(decreaseBtn).toBeDisabled();
    expect(increaseBtn).not.toBeDisabled();

    fireEvent.click(increaseBtn);
    expect(onCountChange).toHaveBeenCalledWith(1);
  });

  it("disables increase button when maxImpostors is reached", () => {
    const onCountChange = vi.fn();
    const onRevealTeammatesChange = vi.fn();
    render(
      <ImpostorCountSection
        count={2}
        maxImpostors={2}
        revealTeammates={true}
        isHost={true}
        onCountChange={onCountChange}
        onRevealTeammatesChange={onRevealTeammatesChange}
      />,
    );

    const increaseBtn = screen.getByTestId("increase-impostors-btn");
    expect(increaseBtn).toBeDisabled();
  });

  it("shows teammate reveal toggle sub-option only when count > 1", () => {
    const onCountChange = vi.fn();
    const onRevealTeammatesChange = vi.fn();
    const { rerender } = render(
      <ImpostorCountSection
        count={1}
        maxImpostors={3}
        revealTeammates={true}
        isHost={true}
        onCountChange={onCountChange}
        onRevealTeammatesChange={onRevealTeammatesChange}
      />,
    );

    expect(
      screen.queryByTestId("reveal-teammates-suboption"),
    ).not.toBeInTheDocument();

    rerender(
      <ImpostorCountSection
        count={2}
        maxImpostors={3}
        revealTeammates={true}
        isHost={true}
        onCountChange={onCountChange}
        onRevealTeammatesChange={onRevealTeammatesChange}
      />,
    );

    const suboption = screen.getByTestId("reveal-teammates-suboption");
    expect(suboption).toBeInTheDocument();

    const switchBtn = screen.getByRole("switch", {
      name: /toggle teammate reveal/i,
    });
    fireEvent.click(switchBtn);
    expect(onRevealTeammatesChange).toHaveBeenCalled();
  });
});
