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

  const stroke = { x: 0, y: 0, color: "#000", isNewStroke: true };

  const mockStore = (amIImpostor: boolean | null, canvasStrokes = [stroke]) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        amIImpostor,
        canvasStrokes,
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

  it.each([
    ["the impostor making the guess", true],
    ["everyone waiting on it", false],
  ])("shows the drawing to %s", (_who, amIImpostor) => {
    mockStore(amIImpostor);

    render(<ImpostorFinalGuess />);

    expect(screen.getByTestId("canvas-snapshot")).toBeInTheDocument();
  });

  it.each([
    ["the impostor", true],
    ["everyone else", false],
  ])("leaves the sheet out for %s when nothing was drawn", (_who, amI) => {
    // Spoken modes reach this screen with a canvas nobody ever touched.
    mockStore(amI, []);

    render(<ImpostorFinalGuess />);

    expect(screen.queryByTestId("canvas-snapshot")).not.toBeInTheDocument();
  });
});
