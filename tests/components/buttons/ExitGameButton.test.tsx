import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExitGameButton } from "../../../src/components/buttons/ExitGameButton";
import { useGameStore } from "../../../src/store/gameState";
import { useModalStore } from "../../../src/store/modalStore";
import { ModalRenderer } from "../../../src/components/modals/ModalRenderer";

// Mock the store
vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ExitGameButton", () => {
  const mockStateBase = {
    roomId: "ROOM123",
    myName: "Alice",
    phase: "LOBBY",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });
    // Reset modal store
    useModalStore.getState().actions.closeModal();
  });

  it("renders the button when roomId, myName are set and phase is LOBBY", () => {
    render(<ExitGameButton />);
    const button = screen.getByTestId("exit-game-button");
    expect(button).toBeInTheDocument();
  });

  it("does not render when roomId is missing", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, roomId: null };
      return selector(state);
    });

    render(<ExitGameButton />);
    const button = screen.queryByTestId("exit-game-button");
    expect(button).not.toBeInTheDocument();
  });

  it("does not render when phase is RESULTS", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, phase: "RESULTS" };
      return selector(state);
    });

    render(<ExitGameButton />);
    const button = screen.queryByTestId("exit-game-button");
    expect(button).not.toBeInTheDocument();
  });

  it("opens the exit game confirmation modal when clicked", async () => {
    render(
      <>
        <ExitGameButton />
        <ModalRenderer />
      </>,
    );

    const button = screen.getByTestId("exit-game-button");
    fireEvent.click(button);

    // Dialog title "Exit Game" from mock en.json key is rendered
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
