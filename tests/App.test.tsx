import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App";
import { useGameStore } from "../src/store/gameState";

// Mock the components used in App
vi.mock("../src/components/JoinScreen", () => ({
  JoinScreen: () => <div data-testid="join-screen">Join Screen</div>,
}));
vi.mock("../src/components/Lobby", () => ({
  Lobby: () => <div data-testid="lobby-screen">Lobby Screen</div>,
}));
vi.mock("../src/components/WordSelection", () => ({
  WordSelection: () => (
    <div data-testid="word-selection-screen">Word Selection Screen</div>
  ),
}));
vi.mock("../src/components/WordReveal", () => ({
  WordReveal: () => (
    <div data-testid="word-reveal-screen">Word Reveal Screen</div>
  ),
}));
vi.mock("../src/components/RoleReveal", () => ({
  RoleReveal: () => (
    <div data-testid="role-reveal-screen">Role Reveal Screen</div>
  ),
}));
vi.mock("../src/components/Canvas", () => ({
  Canvas: () => <div data-testid="canvas-screen">Canvas Screen</div>,
}));
vi.mock("../src/components/VotingScreen", () => ({
  VotingScreen: () => <div data-testid="voting-screen">Voting Screen</div>,
}));
vi.mock("../src/components/GameResult", () => ({
  GameResult: () => (
    <div data-testid="game-result-screen">Game Result Screen</div>
  ),
}));
vi.mock("../src/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => (
    <div data-testid="language-switcher">Language Switcher</div>
  ),
}));
vi.mock("../src/components/EndGameButton", () => ({
  EndGameButton: () => <div data-testid="end-game-button">End Game Button</div>,
}));
vi.mock("../src/components/modals/ModalRenderer", () => ({
  ModalRenderer: () => <div data-testid="modal-renderer">Modal Renderer</div>,
}));

// Mock the store
vi.mock("../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("App LanguageSwitcher Visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStore = (
    phase: string,
    roomId: string | null,
    myName: string | null = "Player",
  ) => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        phase,
        roomId,
        myName,
      };
      return selector(state);
    });
  };

  it("shows LanguageSwitcher on Join Screen (no roomId)", () => {
    mockStore("LOBBY", null, null);
    render(<App />);
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("join-screen")).toBeInTheDocument();
  });

  it("shows LanguageSwitcher on Join Screen (no myName but has roomId)", () => {
    mockStore("LOBBY", "ROOM123", null);
    render(<App />);
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("join-screen")).toBeInTheDocument();
  });

  it("shows LanguageSwitcher in LOBBY phase", () => {
    mockStore("LOBBY", "ROOM123");
    render(<App />);
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("lobby-screen")).toBeInTheDocument();
  });

  it("hides LanguageSwitcher in RESULTS phase", () => {
    mockStore("RESULTS", "ROOM123");
    render(<App />);
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("game-result-screen")).toBeInTheDocument();
  });

  it("renders WordSelection and hides LanguageSwitcher in WORD_SELECTION phase", () => {
    mockStore("WORD_SELECTION", "ROOM123");
    render(<App />);
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("word-selection-screen")).toBeInTheDocument();
  });

  it("hides LanguageSwitcher in ROLE_REVEAL phase", () => {
    mockStore("ROLE_REVEAL", "ROOM123");
    render(<App />);
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("role-reveal-screen")).toBeInTheDocument();
  });

  it("renders WordReveal and hides LanguageSwitcher in WORD_REVEAL phase", () => {
    mockStore("WORD_REVEAL", "ROOM123");
    render(<App />);
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("word-reveal-screen")).toBeInTheDocument();
  });

  it("hides LanguageSwitcher in DRAWING phase", () => {
    mockStore("DRAWING", "ROOM123");
    render(<App />);
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("canvas-screen")).toBeInTheDocument();
  });

  it("hides LanguageSwitcher in VOTING phase", () => {
    mockStore("VOTING", "ROOM123");
    render(<App />);
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("voting-screen")).toBeInTheDocument();
  });
});
