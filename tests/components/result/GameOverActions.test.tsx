import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameOverActions } from "../../../src/components/result/GameOverActions";
import { useGameStore } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("GameOverActions", () => {
  const mockPlayAgain = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({ actions: { playAgain: mockPlayAgain } }),
    );
  });

  it("lets the host take the room back to the lobby", () => {
    render(<GameOverActions isHost={true} />);

    fireEvent.click(screen.getByTestId("play-again-btn"));
    expect(mockPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("tells everyone else who they are waiting for", () => {
    render(<GameOverActions isHost={false} />);

    expect(screen.queryByTestId("play-again-btn")).not.toBeInTheDocument();
    expect(
      screen.getByText("Waiting for host to restart..."),
    ).toBeInTheDocument();
  });
});
