import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { KickPlayerModal } from "../../../src/components/modals/KickPlayerModal";
import { useGameStore } from "../../../src/store/gameState";

// Mock the store
vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("KickPlayerModal", () => {
  const mockOnClose = vi.fn();
  const mockVoteKickPlayer = vi.fn();
  const mockPlayerId = "player-1";
  const mockPlayers = [
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
  ];

  const mockStateBase = {
    players: mockPlayers,
    actions: {
      voteKickPlayer: mockVoteKickPlayer,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) => {
      return selector(mockStateBase);
    });
  });

  it("renders the modal when isOpen is true and player exists", () => {
    render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId={mockPlayerId}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /vote to kick player/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/player one/i)).toBeInTheDocument();
  });

  it("does not render the modal when isOpen is false", () => {
    render(
      <KickPlayerModal
        isOpen={false}
        onClose={mockOnClose}
        playerId={mockPlayerId}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when the cancel button is clicked", () => {
    render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId={mockPlayerId}
      />
    );

    // There are two "Cancel" buttons/labels: one in the header (X) and one in the body.
    // BaseModal uses "closeLabel" for the X button's aria-label.
    // KickPlayerModal uses t("canvas.cancel", "Cancel") for both.

    const cancelButtons = screen.getAllByText(/cancel/i);
    fireEvent.click(cancelButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls voteKickPlayer and onClose when the kick button is clicked", () => {
    render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId={mockPlayerId}
      />
    );

    const kickButton = screen.getByRole("button", { name: /vote to kick$/i });
    fireEvent.click(kickButton);

    expect(mockVoteKickPlayer).toHaveBeenCalledWith(mockPlayerId);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose if the player is not found", () => {
    render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId="non-existent"
      />
    );

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("returns null and does not render if player is not found", () => {
    const { container } = render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId="non-existent"
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
