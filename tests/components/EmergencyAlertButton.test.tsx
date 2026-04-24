import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmergencyAlertButton } from "../../src/components/EmergencyAlertButton";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("EmergencyAlertButton", () => {
  const mockStartEmergencyVoting = vi.fn();

  const mockStateBase = {
    myId: "socket-456",
    players: [
      {
        id: "socket-123",
        name: "Host",
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
      },
      {
        id: "socket-456",
        name: "Player 2",
        isSuspected: false,
        isEjected: false,
        hasStartedEmergencyVoting: false,
      },
    ],
    actions: {
      startEmergencyVoting: mockStartEmergencyVoting,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        ...overrides,
      };
      return selector(state);
    });
  };

  it("renders the alert button", () => {
    mockStore();

    render(<EmergencyAlertButton />);

    expect(screen.getByLabelText("Alert")).toBeInTheDocument();
  });

  it("opens and closes the emergency voting alert dropdown", () => {
    mockStore();

    render(<EmergencyAlertButton />);

    const alertButton = screen.getByLabelText("Alert");
    fireEvent.click(alertButton);

    expect(
      screen.getByText("Do you want to start an emergency voting?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(
      screen.queryByText("Do you want to start an emergency voting?"),
    ).not.toBeInTheDocument();
  });

  it("starts emergency voting and closes the dropdown when confirmed", () => {
    mockStore();

    render(<EmergencyAlertButton />);

    fireEvent.click(screen.getByLabelText("Alert"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(mockStartEmergencyVoting).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText("Do you want to start an emergency voting?"),
    ).not.toBeInTheDocument();
  });

  it("disables the alert button when the player already started emergency voting", () => {
    mockStore({
      players: mockStateBase.players.map((player) =>
        player.id === "socket-456"
          ? { ...player, hasStartedEmergencyVoting: true }
          : player,
      ),
    });

    render(<EmergencyAlertButton />);

    const alertButton = screen.getByLabelText("Alert");
    expect(alertButton).toBeDisabled();

    fireEvent.click(alertButton);

    expect(
      screen.queryByText("Do you want to start an emergency voting?"),
    ).not.toBeInTheDocument();
    expect(mockStartEmergencyVoting).not.toHaveBeenCalled();
  });
});
