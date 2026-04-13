import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EndGameModal } from "../../../src/components/modals/EndGameModal";
import { useGameStore } from "../../../src/store/gameState";

// Mock the store
vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("EndGameModal", () => {
  const mockOnClose = vi.fn();
  const mockEndGame = vi.fn();

  const mockStateBase = {
    actions: {
      endGame: mockEndGame,
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
    render(<EndGameModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/end game/i)).toBeInTheDocument();
  });

  it("does not render the modal when isOpen is false", () => {
    render(<EndGameModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    render(<EndGameModal isOpen={true} onClose={mockOnClose} />);

    const backdrop = screen.getByTestId("close-modal-button-backdrop");
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when the close button is clicked", () => {
    render(<EndGameModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTestId("close-modal-button");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls endGame action and onClose when the end game button is clicked", () => {
    render(<EndGameModal isOpen={true} onClose={mockOnClose} />);

    const endGameButton = screen.getByTestId("confirm-end-game-button");
    fireEvent.click(endGameButton);

    expect(mockEndGame).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
