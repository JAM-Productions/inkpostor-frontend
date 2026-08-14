import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameModeCarousel } from "../../../src/components/modals/options/GameModeCarousel";
import { GAME_MODES } from "../../../src/lib/gameModes";
import type { GameMode } from "../../../src/store/gameState";

describe("GameModeCarousel", () => {
  const onChange = vi.fn();

  const renderCarousel = (gameMode = "CLASSIC", isHost = true) =>
    render(
      <GameModeCarousel
        isHost={isHost}
        gameMode={gameMode as GameMode}
        onChange={onChange}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the currently selected mode", () => {
    renderCarousel("CLASSIC");

    expect(screen.getByText("Classic")).toBeInTheDocument();
    expect(screen.queryByText("Chaos")).not.toBeInTheDocument();
  });

  it("applies the next mode immediately, without a confirm step", async () => {
    const user = userEvent.setup();
    renderCarousel("CLASSIC");

    await user.click(screen.getByRole("button", { name: /next game mode/i }));

    expect(onChange).toHaveBeenCalledWith("CUSTOM_WORD");
  });

  it("wraps around when moving past the first mode", async () => {
    const user = userEvent.setup();
    renderCarousel("CLASSIC");

    await user.click(
      screen.getByRole("button", { name: /previous game mode/i }),
    );

    // Going back from the first mode lands on the last one
    expect(onChange).toHaveBeenCalledWith(GAME_MODES[GAME_MODES.length - 1].id);
  });

  it("offers the hot word mode", async () => {
    const user = userEvent.setup();
    renderCarousel("CUSTOM_WORD");

    await user.click(screen.getByRole("button", { name: /next game mode/i }));
    expect(onChange).toHaveBeenCalledWith("HOT_WORD");

    renderCarousel("HOT_WORD");
    expect(screen.getAllByText("Hot Word").length).toBeGreaterThan(0);
  });

  it("selects a mode from its dot", async () => {
    const user = userEvent.setup();
    renderCarousel("CUSTOM_WORD");

    expect(screen.getByText("Chaos")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /select classic mode/i }),
    );

    expect(onChange).toHaveBeenCalledWith("CLASSIC");
  });

  it("does not re-send the mode that is already selected", async () => {
    const user = userEvent.setup();
    renderCarousel("CLASSIC");

    await user.click(
      screen.getByRole("button", { name: /select classic mode/i }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps every description mounted so switching modes cannot shift the layout", () => {
    renderCarousel("CLASSIC");

    const selected = screen.getByText(/drawn at random/i);
    const other = screen.getByText(/Every player writes a word/i);

    // Both occupy the same grid cell; only the selected one is visible
    expect(selected).toHaveClass("opacity-100");
    expect(other).toHaveClass("opacity-0");
    expect(other).toHaveAttribute("aria-hidden", "true");
  });

  it("flags the mode that only works with everyone in the same room", () => {
    const { unmount } = renderCarousel("CLASSIC");
    expect(screen.queryByTestId("in-person-badge")).not.toBeInTheDocument();
    unmount();

    renderCarousel("ORIGINAL");
    expect(screen.getByTestId("in-person-badge")).toHaveTextContent(
      "Best played in person",
    );
  });

  it("is read-only for non-hosts", () => {
    renderCarousel("CUSTOM_WORD", false);

    expect(screen.getByText("Chaos")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next game mode/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /previous game mode/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /select classic mode/i }),
    ).toBeDisabled();
  });
});
