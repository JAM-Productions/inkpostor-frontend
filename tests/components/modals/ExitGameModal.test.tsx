import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExitGameModal } from "../../../src/components/modals/ExitGameModal";
import { useGameStore } from "../../../src/store/gameState";

// Mock the store
vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ExitGameModal", () => {
  const mockOnClose = vi.fn();
  const mockExitGame = vi.fn();

  const mockStateBase = {
    actions: {
      exitGame: mockExitGame,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });
  });

  it("renders the modal when isOpen is true", () => {
    render(<ExitGameModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/exit game/i)).toBeInTheDocument();
    expect(screen.getByText(/leave the room/i)).toBeInTheDocument();
  });

  it("does not render the modal when isOpen is false", () => {
    render(<ExitGameModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when the cancel/close button is clicked", () => {
    render(<ExitGameModal isOpen={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls exitGame action and onClose when the exit button is clicked", () => {
    render(<ExitGameModal isOpen={true} onClose={mockOnClose} />);

    const confirmButton = screen.getByTestId("confirm-exit-game-button");
    fireEvent.click(confirmButton);

    expect(mockExitGame).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
