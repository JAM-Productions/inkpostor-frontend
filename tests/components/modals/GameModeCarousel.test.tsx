import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameModeCarousel } from "../../../src/components/modals/GameModeCarousel";
import { useGameStore } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("GameModeCarousel", () => {
  const mockSetGameMode = vi.fn();

  const mockStore = (gameMode = "CLASSIC") => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ gameMode, actions: { setGameMode: mockSetGameMode } }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the currently selected mode", () => {
    mockStore("CLASSIC");

    render(<GameModeCarousel isHost={true} />);

    expect(screen.getByText("Classic")).toBeInTheDocument();
    expect(screen.queryByText("Chaos")).not.toBeInTheDocument();
  });

  it("applies the next mode immediately, without a confirm step", async () => {
    const user = userEvent.setup();
    mockStore("CLASSIC");

    render(<GameModeCarousel isHost={true} />);

    await user.click(screen.getByRole("button", { name: /next game mode/i }));

    expect(mockSetGameMode).toHaveBeenCalledWith("CUSTOM_WORD");
  });

  it("wraps around when moving past the first mode", async () => {
    const user = userEvent.setup();
    mockStore("CLASSIC");

    render(<GameModeCarousel isHost={true} />);

    await user.click(
      screen.getByRole("button", { name: /previous game mode/i }),
    );

    // Going back from the first mode lands on the last one
    expect(mockSetGameMode).toHaveBeenCalledWith("HOT_WORD");
  });

  it("offers the hot word mode", async () => {
    const user = userEvent.setup();
    mockStore("CUSTOM_WORD");

    render(<GameModeCarousel isHost={true} />);

    await user.click(screen.getByRole("button", { name: /next game mode/i }));
    expect(mockSetGameMode).toHaveBeenCalledWith("HOT_WORD");

    mockStore("HOT_WORD");
    render(<GameModeCarousel isHost={true} />);
    expect(screen.getAllByText("Hot Word").length).toBeGreaterThan(0);
  });

  it("selects a mode from its dot", async () => {
    const user = userEvent.setup();
    mockStore("CUSTOM_WORD");

    render(<GameModeCarousel isHost={true} />);

    expect(screen.getByText("Chaos")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /select classic mode/i }),
    );

    expect(mockSetGameMode).toHaveBeenCalledWith("CLASSIC");
  });

  it("does not re-send the mode that is already selected", async () => {
    const user = userEvent.setup();
    mockStore("CLASSIC");

    render(<GameModeCarousel isHost={true} />);

    await user.click(
      screen.getByRole("button", { name: /select classic mode/i }),
    );

    expect(mockSetGameMode).not.toHaveBeenCalled();
  });

  it("keeps every description mounted so switching modes cannot shift the layout", () => {
    mockStore("CLASSIC");

    render(<GameModeCarousel isHost={true} />);

    const selected = screen.getByText(/drawn at random/i);
    const other = screen.getByText(/Every player writes a word/i);

    // Both occupy the same grid cell; only the selected one is visible
    expect(selected).toHaveClass("opacity-100");
    expect(other).toHaveClass("opacity-0");
    expect(other).toHaveAttribute("aria-hidden", "true");
  });

  it("is read-only for non-hosts", () => {
    mockStore("CUSTOM_WORD");

    render(<GameModeCarousel isHost={false} />);

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
