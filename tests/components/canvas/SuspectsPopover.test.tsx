import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SuspectsPopover } from "../../../src/components/canvas/SuspectsPopover";
import { useGameStore } from "../../../src/store/gameState";
import { useModalStore } from "../../../src/store/modalStore";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

vi.mock("../../../src/store/modalStore", () => ({
  useModalStore: vi.fn(),
}));

describe("SuspectsPopover", () => {
  const mockToggleSus = vi.fn();
  const mockOpenModal = vi.fn();

  const mockStateBase = {
    myId: "socket-123",
    currentTurnPlayerId: "socket-456", // not my turn
    hostId: "socket-123",
    kickVotes: {},
    players: [
      { id: "socket-123", name: "Host", isConnected: true, isSuspected: false },
      {
        id: "socket-456",
        name: "Player 2",
        isConnected: true,
        isSuspected: false,
      },
      {
        id: "socket-789",
        name: "Player 3",
        isConnected: true,
        isSuspected: false,
      },
    ],
    actions: { toggleSus: mockToggleSus, voteKickPlayer: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useModalStore as any).mockImplementation((selector: any) =>
      selector({ actions: { openModal: mockOpenModal } }),
    );
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ ...mockStateBase, ...overrides }),
    );
  };

  it("does not render on the player's own turn", () => {
    mockStore({ currentTurnPlayerId: "socket-123" });
    const { container } = render(<SuspectsPopover />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the Players button when it is not my turn", () => {
    mockStore();
    render(<SuspectsPopover />);
    expect(screen.getByLabelText("Players")).toBeInTheDocument();
  });

  it("lists every other player when opened, excluding myself", () => {
    mockStore();
    render(<SuspectsPopover />);

    fireEvent.click(screen.getByLabelText("Players"));

    expect(screen.getByTitle("Player 2")).toBeInTheDocument();
    expect(screen.getByTitle("Player 3")).toBeInTheDocument();
    expect(screen.queryByTitle("Host")).not.toBeInTheDocument();
  });

  it("toggles suspicion when clicking a player", () => {
    mockStore();
    render(<SuspectsPopover />);

    fireEvent.click(screen.getByLabelText("Players"));
    fireEvent.click(screen.getByTitle("Player 2"));

    expect(mockToggleSus).toHaveBeenCalledWith("socket-456");
  });

  it("renders a vote-to-kick button for each suspect", () => {
    mockStore();
    render(<SuspectsPopover />);

    fireEvent.click(screen.getByLabelText("Players"));

    // Two connected suspects, each requiring 2 votes => "0/2".
    expect(screen.getAllByText("0/2")).toHaveLength(2);
  });
});
