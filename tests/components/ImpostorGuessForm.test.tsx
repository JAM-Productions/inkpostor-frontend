import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImpostorGuessForm } from "../../src/components/ImpostorGuessForm";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ImpostorGuessForm", () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ actions: { submitImpostorGuess: mockSubmit } }),
    );
  });

  it("submits the trimmed guess with the active language and clears the input", () => {
    render(<ImpostorGuessForm />);

    const input = screen.getByPlaceholderText(
      "Type the secret word...",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Perro  " } });
    fireEvent.click(screen.getByRole("button"));

    expect(mockSubmit).toHaveBeenCalledWith("Perro", "en");
    expect(input.value).toBe("");
  });

  it("disables the submit button when the input is empty or whitespace", () => {
    render(<ImpostorGuessForm />);

    const input = screen.getByPlaceholderText("Type the secret word...");
    const submit = screen.getByRole("button");

    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: "   " } });
    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: "cat" } });
    expect(submit).toBeEnabled();
  });

  it("shows the remaining attempts when provided", () => {
    render(<ImpostorGuessForm attemptsLeft={2} />);
    expect(screen.getByText("Attempts left: 2")).toBeInTheDocument();
  });

  it("omits the attempts label when not provided", () => {
    render(<ImpostorGuessForm />);
    expect(screen.queryByText(/attempts left/i)).not.toBeInTheDocument();
  });
});
