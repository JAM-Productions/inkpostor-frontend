import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModalRenderer } from "../../../src/components/modals/ModalRenderer";
import { useModalStore } from "../../../src/store/modalStore";
import { useGameStore } from "../../../src/store/gameState";

// Mock the stores
vi.mock("../../../src/store/modalStore", () => ({
  useModalStore: vi.fn(),
}));

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

// Mock the modal components to avoid rendering their full content
vi.mock("../../../src/components/modals/RulesModal", () => ({
  RulesModal: () => <div data-testid="rules-modal" />,
}));
vi.mock("../../../src/components/modals/EndGameModal", () => ({
  EndGameModal: () => <div data-testid="end-game-modal" />,
}));
vi.mock("../../../src/components/modals/OptionsModal", () => ({
  OptionsModal: () => <div data-testid="options-modal" />,
}));
vi.mock("../../../src/components/modals/KickPlayerModal", () => ({
  KickPlayerModal: () => <div data-testid="kick-player-modal" />,
}));
vi.mock("../../../src/components/modals/ExitGameModal", () => ({
  ExitGameModal: () => <div data-testid="exit-game-modal" />,
}));

describe("ModalRenderer", () => {
  const mockCloseModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMocks = (modalState: any, gameState: any) => {
    (useModalStore as any).mockImplementation((selector: any) =>
      selector({
        ...modalState,
        actions: { closeModal: mockCloseModal },
      }),
    );
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(gameState),
    );
  };

  it("renders nothing when no modal is active", () => {
    setupMocks(
      { activeModal: null, modalData: null },
      { players: [], phase: "LOBBY" },
    );
    const { container } = render(<ModalRenderer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders RulesModal when activeModal is RULES", () => {
    setupMocks(
      { activeModal: "RULES", modalData: null },
      { players: [], phase: "LOBBY" },
    );
    const { getByTestId } = render(<ModalRenderer />);
    expect(getByTestId("rules-modal")).toBeInTheDocument();
  });

  it("closes KICK_PLAYER modal if player no longer exists", () => {
    setupMocks(
      { activeModal: "KICK_PLAYER", modalData: { playerId: "player-1" } },
      { players: [{ id: "player-2" }], phase: "LOBBY" },
    );
    render(<ModalRenderer />);
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it("does not render KICK_PLAYER modal if player no longer exists", () => {
    setupMocks(
      { activeModal: "KICK_PLAYER", modalData: { playerId: "player-1" } },
      { players: [{ id: "player-2" }], phase: "LOBBY" },
    );
    const { queryByTestId } = render(<ModalRenderer />);
    expect(queryByTestId("kick-player-modal")).not.toBeInTheDocument();
  });

  it("renders KICK_PLAYER modal if player exists", () => {
    setupMocks(
      { activeModal: "KICK_PLAYER", modalData: { playerId: "player-1" } },
      { players: [{ id: "player-1" }], phase: "LOBBY" },
    );
    const { getByTestId } = render(<ModalRenderer />);
    expect(getByTestId("kick-player-modal")).toBeInTheDocument();
  });

  it("closes OPTIONS modal if phase is not LOBBY", () => {
    setupMocks(
      { activeModal: "OPTIONS", modalData: null },
      { players: [], phase: "DRAWING" },
    );
    render(<ModalRenderer />);
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it("does not render OPTIONS modal if phase is not LOBBY", () => {
    setupMocks(
      { activeModal: "OPTIONS", modalData: null },
      { players: [], phase: "DRAWING" },
    );
    const { queryByTestId } = render(<ModalRenderer />);
    expect(queryByTestId("options-modal")).not.toBeInTheDocument();
  });

  it("renders OPTIONS modal if phase is LOBBY", () => {
    setupMocks(
      { activeModal: "OPTIONS", modalData: null },
      { players: [], phase: "LOBBY" },
    );
    const { getByTestId } = render(<ModalRenderer />);
    expect(getByTestId("options-modal")).toBeInTheDocument();
  });
});
