import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImpostorFinalGuess } from "../../src/components/ImpostorFinalGuess";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ImpostorFinalGuess", () => {
  const mockSkip = vi.fn();
  const mockSubmit = vi.fn();

  const mockStore = (amIImpostor: boolean | null) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        amIImpostor,
        canvasStrokes: [{ x: 5, y: 5, color: "#000000", isNewStroke: true }],
        actions: {
          skipImpostorGuess: mockSkip,
          submitImpostorGuess: mockSubmit,
        },
      }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the guess window with a skip button to the ejected impostor", () => {
    mockStore(true);

    render(<ImpostorFinalGuess />);

    expect(screen.getByText("You've been eliminated")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type the secret word..."),
    ).toBeInTheDocument();

    const skipBtn = screen.getByRole("button", { name: "Skip" });
    fireEvent.click(skipBtn);
    expect(mockSkip).toHaveBeenCalled();
  });

  it("shows the canvas preview to both the impostor and the rest", () => {
    mockStore(true);
    const { unmount } = render(<ImpostorFinalGuess />);
    expect(screen.getByTestId("canvas-preview")).toBeInTheDocument();
    unmount();

    mockStore(false);
    render(<ImpostorFinalGuess />);
    expect(screen.getByTestId("canvas-preview")).toBeInTheDocument();
  });

  it("shows a waiting screen to everyone else", () => {
    mockStore(false);

    render(<ImpostorFinalGuess />);

    expect(screen.getByText(/is making a final guess/i)).toBeInTheDocument();
    expect(
      screen.queryByText("You've been eliminated"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Type the secret word..."),
    ).not.toBeInTheDocument();
  });
});
