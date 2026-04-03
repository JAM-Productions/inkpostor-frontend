import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Lobby } from "../../src/components/Lobby";
import { useGameStore } from "../../src/store/gameState";
import i18n from "../../src/i18n";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("RulesModal Translations", () => {
  const mockStartGame = vi.fn();

  const mockStateBase = {
    roomId: "TESTX9",
    myId: "socket-123",
    hostId: "socket-123",
    players: [],
    actions: { startGame: mockStartGame },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage("en");
  });

  const openRules = async () => {
    (useGameStore as any).mockImplementation((selector: any) => selector(mockStateBase));
    render(<Lobby />);
    const howToPlayBtn = screen.getByTestId("how-to-play-btn");
    await userEvent.click(howToPlayBtn);
  };

  it("renders rules in English", async () => {
    await i18n.changeLanguage("en");
    await openRules();

    expect(screen.getByText("How to Play Inkpostor")).toBeInTheDocument();
    expect(screen.getByText("Objective")).toBeInTheDocument();
    expect(screen.getByText("Find out who the impostor is… or fool everyone if it's you.")).toBeInTheDocument();
    expect(screen.getByText("GOT IT!")).toBeInTheDocument();
  });

  it("renders rules in Spanish", async () => {
    await i18n.changeLanguage("es");
    await openRules();

    expect(screen.getByText("Cómo Jugar a Inkpostor")).toBeInTheDocument();
    expect(screen.getByText("Objetivo")).toBeInTheDocument();
    expect(screen.getByText("Descubre quién es el impostor... o engaña a todos si eres tú.")).toBeInTheDocument();
    expect(screen.getByText("¡ENTENDIDO!")).toBeInTheDocument();
  });

  it("renders rules in Catalan", async () => {
    await i18n.changeLanguage("ca");
    await openRules();

    expect(screen.getByText("Com Jugar a Inkpostor")).toBeInTheDocument();
    expect(screen.getByText("Objectiu")).toBeInTheDocument();
    expect(screen.getByText("Descobreix qui és l'impostor... o enganya a tothom si ho ets tu.")).toBeInTheDocument();
    expect(screen.getByText("ENTESOS!")).toBeInTheDocument();
  });
});
