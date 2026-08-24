import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Topbar } from "../../src/components/Topbar";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

vi.mock("../../src/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock("../../src/components/buttons/EndGameButton", () => ({
  EndGameButton: () => <div data-testid="end-game-button" />,
}));

vi.mock("../../src/components/buttons/ExitGameButton", () => ({
  ExitGameButton: () => <div data-testid="exit-game-button" />,
}));

vi.mock("../../src/components/buttons/ReturnHomeButton", () => ({
  ReturnHomeButton: () => <div data-testid="return-home-button" />,
}));

vi.mock("../../src/components/buttons/SoundToggleButton", () => ({
  SoundToggleButton: () => <div data-testid="sound-toggle-btn" />,
}));

vi.mock("../../src/components/buttons/RoomCodeButton", () => ({
  RoomCodeButton: ({ roomId }: { roomId: string }) => (
    <div data-testid="room-code-button">{roomId}</div>
  ),
}));

describe("Topbar", () => {
  const mockState = {
    phase: "ROLE_REVEAL",
    roomId: "TESTX9",
    myName: "Alice",
    gameEnded: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockState) => unknown) => selector(mockState),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the room code only during an active game", () => {
    render(<Topbar />);

    expect(screen.getByTestId("room-code-button")).toHaveTextContent("TESTX9");
    expect(screen.getByTestId("sound-toggle-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
  });

  it("shows the language switcher instead of the room code in the lobby", () => {
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockState) => unknown) =>
        selector({ ...mockState, phase: "LOBBY" }),
    );

    render(<Topbar />);

    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("sound-toggle-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("room-code-button")).not.toBeInTheDocument();
  });

  it("does not render when the game has ended and no controls are available", () => {
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockState) => unknown) =>
        selector({ ...mockState, gameEnded: true }),
    );

    render(<Topbar />);

    expect(screen.queryByTestId("topbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("topbar-background")).not.toBeInTheDocument();
    expect(screen.queryByTestId("room-code-button")).not.toBeInTheDocument();
  });

  it("keeps itself alive for the way out of a finished game", () => {
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockState) => unknown) =>
        selector({ ...mockState, phase: "RESULTS", gameEnded: true }),
    );

    render(<Topbar />);

    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    // ...and it is the only thing left up there
    expect(screen.getByTestId("return-home-button")).toBeInTheDocument();
    expect(screen.queryByTestId("room-code-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
  });
});
