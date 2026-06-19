import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VoteKickButton } from "../../../src/components/buttons/VoteKickButton";
import { useGameStore } from "../../../src/store/gameState";
import { useModalStore } from "../../../src/store/modalStore";

// Mock the stores
vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

vi.mock("../../../src/store/modalStore", () => ({
  useModalStore: vi.fn(),
}));

describe("VoteKickButton", () => {
  const mockVoteKickPlayer = vi.fn();
  const mockOpenModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        myId: "my-id",
        hostId: "host-id",
        players: [
          { id: "my-id", name: "Me", isConnected: true },
          { id: "host-id", name: "Host", isConnected: true },
          { id: "another-id", name: "Another", isConnected: true },
          { id: "target-id", name: "Target", isConnected: true },
        ],
        kickVotes: {},
        actions: {
          voteKickPlayer: mockVoteKickPlayer,
        },
      };
      return selector(state);
    });

    (useModalStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          openModal: mockOpenModal,
        },
      };
      return selector(state);
    });
  });

  it("renders the button correctly", () => {
    render(
      <VoteKickButton
        player={{ id: "target-id", name: "Target Player" }}
        requiredVotes={3}
      />,
    );

    // Check if the button renders the correct required votes
    expect(screen.getByText("0/3")).toBeInTheDocument();
  });

  it("does not render if player is me", () => {
    const { container } = render(
      <VoteKickButton player={{ id: "my-id", name: "Me" }} requiredVotes={3} />,
    );

    // Should return null
    expect(container.firstChild).toBeNull();
  });

  it("does not render if player is the host", () => {
    const { container } = render(
      <VoteKickButton
        player={{ id: "host-id", name: "Host" }}
        requiredVotes={3}
      />,
    );

    // Should return null
    expect(container.firstChild).toBeNull();
  });

  it("opens the modal when clicking and not previously voted", () => {
    const mockOnAction = vi.fn();
    render(
      <VoteKickButton
        player={{ id: "target-id", name: "Target" }}
        requiredVotes={3}
        onAction={mockOnAction}
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(mockOnAction).toHaveBeenCalled();
    expect(mockOpenModal).toHaveBeenCalledWith("KICK_PLAYER", {
      playerId: "target-id",
    });
    expect(mockVoteKickPlayer).not.toHaveBeenCalled();
  });

  it("directly unvotes (toggles) without opening modal if already voted", () => {
    // Override store to simulate already having voted
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        myId: "my-id",
        players: [
          { id: "my-id", name: "Me", isConnected: true },
          { id: "another-id", name: "Another", isConnected: true },
          { id: "target-id", name: "Target", isConnected: true },
        ],
        kickVotes: { "target-id": ["my-id", "another-id"] },
        actions: {
          voteKickPlayer: mockVoteKickPlayer,
        },
      };
      return selector(state);
    });

    const mockOnAction = vi.fn();
    render(
      <VoteKickButton
        player={{ id: "target-id", name: "Target" }}
        requiredVotes={3}
        onAction={mockOnAction}
      />,
    );

    // Should show 2/3 votes
    expect(screen.getByText("2/3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(mockOnAction).toHaveBeenCalled();
    expect(mockVoteKickPlayer).toHaveBeenCalledWith("target-id");
    expect(mockOpenModal).not.toHaveBeenCalled();
  });

  it("only counts votes from connected players", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        myId: "my-id",
        players: [
          { id: "my-id", name: "Me", isConnected: true },
          { id: "p2", name: "Player 2", isConnected: false },
          { id: "p3", name: "Player 3", isConnected: true },
          { id: "target-id", name: "Target", isConnected: true },
        ],
        kickVotes: { "target-id": ["p2", "p3"] },
        actions: {
          voteKickPlayer: mockVoteKickPlayer,
        },
      };
      return selector(state);
    });

    render(
      <VoteKickButton
        player={{ id: "target-id", name: "Target" }}
        requiredVotes={4}
      />,
    );

    // Should show 1/4 votes since p2 is disconnected
    expect(screen.getByText("1/4")).toBeInTheDocument();
  });
});
