import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EndGameButton } from "../../src/components/EndGameButton";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("EndGameButton", () => {
  const mockStateBase = {
    myId: "socket-123",
    hostId: "socket-123",
    phase: "ROLE_REVEAL",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });
  });

  it("renders the button when user is host and phase is ROLE_REVEAL", () => {
    render(<EndGameButton />);

    const button = screen.getByRole("button", { name: /end game/i });
    expect(button).toBeInTheDocument();
  });

  it("does not render the button when user is not the host", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, myId: "socket-456" };
      return selector(state);
    });

    render(<EndGameButton />);

    const button = screen.queryByRole("button", { name: /end game/i });
    expect(button).not.toBeInTheDocument();
  });

  it("does not render the button when phase is LOBBY", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, phase: "LOBBY" };
      return selector(state);
    });

    render(<EndGameButton />);

    const button = screen.queryByRole("button", { name: /end game/i });
    expect(button).not.toBeInTheDocument();
  });

  it("opens the modal when button is clicked", async () => {
    render(<EndGameButton />);

    const button = screen.getByRole("button", { name: /end game/i });
    fireEvent.click(button);

    // Wait for the modal to appear
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
