import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnHomeButton } from "../../../src/components/buttons/ReturnHomeButton";
import { useGameStore } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ReturnHomeButton", () => {
  const mockExitGame = vi.fn();

  const mockStore = (overrides: Record<string, unknown> = {}) => {
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          phase: "RESULTS",
          gameEnded: true,
          roomId: "TESTX9",
          myName: "Alice",
          actions: { exitGame: mockExitGame },
          ...overrides,
        }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("spells itself out and leaves the game when the game is over", () => {
    mockStore();

    render(<ReturnHomeButton />);

    const button = screen.getByTestId("return-home-button");
    expect(button).toHaveTextContent("Return to Home Screen");

    fireEvent.click(button);
    expect(mockExitGame).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a round result", { gameEnded: false }],
    ["another phase", { phase: "VOTING" }],
    ["the join screen", { roomId: null }],
  ])("stays out of the way during %s", (_case, overrides) => {
    mockStore(overrides);

    render(<ReturnHomeButton />);

    expect(screen.queryByTestId("return-home-button")).not.toBeInTheDocument();
  });
});
