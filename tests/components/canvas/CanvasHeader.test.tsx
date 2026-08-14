import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CanvasHeader } from "../../../src/components/canvas/CanvasHeader";
import { useGameStore } from "../../../src/store/gameState";
import { useModalStore } from "../../../src/store/modalStore";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

vi.mock("../../../src/store/modalStore", () => ({
  useModalStore: vi.fn(),
}));

describe("CanvasHeader", () => {
  const mockEndTurn = vi.fn();

  const mockStateBase = {
    myId: "socket-123",
    currentTurnPlayerId: "socket-123", // my turn by default
    hostId: "socket-123",
    isMobile: false,
    gameOptions: {
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
      unlimitedInk: false,
      roundTime: 20,
    },
    amIImpostor: false,
    impostorGuessesUsed: 0,
    kickVotes: {},
    players: [
      {
        id: "socket-123",
        name: "Host",
        isConnected: true,
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
      },
      {
        id: "socket-456",
        name: "Player 2",
        isConnected: true,
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
      },
    ],
    actions: {
      endTurn: mockEndTurn,
      toggleSus: vi.fn(),
      startEmergencyVoting: vi.fn(),
      submitImpostorGuess: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useModalStore as any).mockImplementation((selector: any) =>
      selector({ actions: { openModal: vi.fn() } }),
    );
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ ...mockStateBase, ...overrides }),
    );
  };

  it("shows 'Your turn!' and ends the turn when clicking Done", () => {
    mockStore();
    render(<CanvasHeader timeLeft={20000} />);

    expect(screen.getByText("Your turn!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(mockEndTurn).toHaveBeenCalledTimes(1);
  });

  it("shows the active player's name and 'Now Drawing' when waiting", () => {
    mockStore({ myId: "socket-456", currentTurnPlayerId: "socket-123" });
    render(<CanvasHeader timeLeft={20000} />);

    expect(screen.getByText("Now Drawing")).toBeInTheDocument();
    expect(screen.getByText("Host")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /done/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the offline status and a spinner when the active player is disconnected", () => {
    mockStore({
      myId: "socket-456",
      currentTurnPlayerId: "socket-123",
      players: [
        {
          id: "socket-123",
          name: "Host",
          isConnected: false,
          isSuspected: false,
          isEjected: false,
          hasStartedEmergencyVoting: false,
        },
        {
          id: "socket-456",
          name: "Player 2",
          isConnected: true,
          isSuspected: false,
          isEjected: false,
          hasStartedEmergencyVoting: false,
        },
      ],
    });
    const { container } = render(<CanvasHeader timeLeft={20000} />);

    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders the countdown from the timeLeft prop", () => {
    mockStore();
    render(<CanvasHeader timeLeft={12300} />);
    expect(screen.getByText("12.3")).toBeInTheDocument();
  });

  it("hides the suspects and alert controls on my turn", () => {
    mockStore();
    render(<CanvasHeader timeLeft={20000} />);

    expect(screen.queryByLabelText("Players")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Alert")).not.toBeInTheDocument();
  });
});
