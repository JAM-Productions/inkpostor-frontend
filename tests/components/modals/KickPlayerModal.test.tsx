import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("calls onClose when the close button (X) is clicked", async () => {
    const user = userEvent.setup();
    render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId={mockPlayerId}
      />
    );

    const closeButton = screen.getByTestId("close-modal-button");
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when the cancel button in the body is clicked", async () => {
    const user = userEvent.setup();
    render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId={mockPlayerId}
      />
    );

    const cancelButton = screen.getByTestId("cancel-kick-button");
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls voteKickPlayer and onClose when the kick button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <KickPlayerModal
        isOpen={true}
        onClose={mockOnClose}
        playerId={mockPlayerId}
      />
    );

    const kickButton = screen.getByTestId("confirm-kick-button");
    await user.click(kickButton);

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
