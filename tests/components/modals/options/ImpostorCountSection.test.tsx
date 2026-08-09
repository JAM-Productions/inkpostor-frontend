import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImpostorCountSection } from "../../../../src/components/modals/options/ImpostorCountSection";

describe("ImpostorCountSection", () => {
  it("renders correctly with count and teammate reveal toggle when count > 1", () => {
    render(
      <ImpostorCountSection
        count={2}
        maxImpostors={3}
        revealTeammates={true}
        isHost={true}
        onCountChange={vi.fn()}
        onRevealTeammatesChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("impostor-count-value")).toHaveTextContent("2");
    expect(screen.getByTestId("increase-impostors-btn")).not.toBeDisabled();
    expect(screen.getByTestId("decrease-impostors-btn")).not.toBeDisabled();
    expect(
      screen.getByTestId("reveal-teammates-suboption"),
    ).toBeInTheDocument();
  });

  it("disables decrease button when count is 1", () => {
    render(
      <ImpostorCountSection
        count={1}
        maxImpostors={3}
        revealTeammates={true}
        isHost={true}
        onCountChange={vi.fn()}
        onRevealTeammatesChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("decrease-impostors-btn")).toBeDisabled();
    expect(
      screen.queryByTestId("reveal-teammates-toggle"),
    ).not.toBeInTheDocument();
  });

  it("calls onCountChange when stepper buttons are clicked", () => {
    const onCountChange = vi.fn();
    render(
      <ImpostorCountSection
        count={2}
        maxImpostors={3}
        revealTeammates={true}
        isHost={true}
        onCountChange={onCountChange}
        onRevealTeammatesChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("increase-impostors-btn"));
    expect(onCountChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTestId("decrease-impostors-btn"));
    expect(onCountChange).toHaveBeenCalledWith(-1);
  });
});
