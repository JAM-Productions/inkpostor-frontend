import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OptionsModal } from "../../../src/components/modals/OptionsModal";
import { useGameStore } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("OptionsModal", () => {
  const mockOnClose = vi.fn();
  const mockUpdateGameOptions = vi.fn();
  const mockSetGameMode = vi.fn();

  const createState = (overrides = {}) => ({
    gameOptions: {
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: false,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
    },
    gameMode: "CLASSIC",
    myId: "player-1",
    hostId: "player-1",
    actions: {
      updateGameOptions: mockUpdateGameOptions,
      setGameMode: mockSetGameMode,
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the modal when isOpen is true", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByText("Save Options")).toBeInTheDocument();
  });

  it("does not render the modal when isOpen is false", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId("close-modal-button-backdrop"));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("updates and saves options for the host", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    await user.click(screen.getByRole("radio", { name: /35 seconds/i }));
    await user.click(screen.getByRole("switch", { name: /toggle ink limit/i }));
    await user.click(
      screen.getByRole("switch", {
        name: /toggle canvas clearing each round/i,
      }),
    );
    await user.click(
      screen.getByRole("switch", { name: /toggle player colors/i }),
    );
    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith({
      roundTime: 35,
      unlimitedInk: true,
      clearCanvasEachRound: false,
      playerColorsEnabled: true,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("defaults player colors off and only applies them on save", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    const playerColorsSwitch = screen.getByRole("switch", {
      name: /toggle player colors/i,
    });
    expect(playerColorsSwitch).toHaveAttribute("aria-checked", "false");

    await user.click(playerColorsSwitch);
    expect(playerColorsSwitch).toHaveAttribute("aria-checked", "true");
    expect(mockUpdateGameOptions).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith(
      expect.objectContaining({ playerColorsEnabled: true }),
    );
  });

  it("reveals the attempts stepper only when impostor guessing is enabled and saves the chosen count", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    // Stepper hidden while the feature is off
    expect(screen.queryByText("Number of attempts")).not.toBeInTheDocument();

    // Enable the feature -> stepper appears (default 3)
    await user.click(
      screen.getByRole("switch", { name: /toggle impostor guessing/i }),
    );
    expect(screen.getByText("Number of attempts")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Decrease twice (3 -> 2 -> 1) and confirm it clamps at the minimum
    const decrease = screen.getByRole("button", { name: /decrease attempts/i });
    await user.click(decrease);
    await user.click(decrease);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(decrease).toBeDisabled();

    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith({
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: false,
      impostorGuessEnabled: true,
      impostorGuessAttempts: 1,
    });
  });

  it("renders the game mode carousel as the first section", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    const sections = screen.getByRole("dialog").querySelectorAll("section");
    expect(sections[0]).toBe(screen.getByTestId("game-mode-carousel"));
  });

  it("applies the game mode instantly and leaves it out of the saved options", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    await user.click(screen.getByRole("button", { name: /next game mode/i }));
    expect(mockSetGameMode).toHaveBeenCalledWith("CUSTOM_WORD");

    await user.click(screen.getByTestId("confirm-options-button"));
    expect(mockUpdateGameOptions).toHaveBeenCalledWith({
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: false,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
    });
  });

  it("locks the impostor guess off while the custom word mode is selected", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(
        createState({
          gameMode: "CUSTOM_WORD",
          gameOptions: {
            roundTime: 30,
            unlimitedInk: false,
            playerColorsEnabled: false,
            clearCanvasEachRound: true,
            // Even if the server still reported it on, the mode wins
            impostorGuessEnabled: true,
            impostorGuessAttempts: 3,
          },
        }),
      ),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    // The toggle is replaced by a padlock, so there is nothing to click
    expect(
      screen.queryByRole("switch", { name: /toggle impostor guessing/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("impostor-guess-locked")).toBeInTheDocument();
    expect(
      screen.getByTestId("impostor-guess-unavailable"),
    ).toBeInTheDocument();
    // The attempts stepper follows the disabled option
    expect(screen.queryByText("Number of attempts")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith(
      expect.objectContaining({ impostorGuessEnabled: false }),
    );
  });

  it("locks the canvas clearing on while the hot word mode is selected", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(
        createState({
          gameMode: "HOT_WORD",
          gameOptions: {
            roundTime: 30,
            unlimitedInk: false,
            playerColorsEnabled: false,
            // Even if the server still reported it off, the mode wins
            clearCanvasEachRound: false,
            impostorGuessEnabled: false,
            impostorGuessAttempts: 3,
          },
        }),
      ),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.queryByRole("switch", { name: /toggle canvas clearing/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("clear-canvas-locked")).toBeInTheDocument();
    expect(screen.getByTestId("clear-canvas-locked-notice")).toHaveTextContent(
      /hot word/i,
    );
    // This mode does allow the impostor to guess
    expect(
      screen.getByRole("switch", { name: /toggle impostor guessing/i }),
    ).toBeEnabled();

    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith(
      expect.objectContaining({ clearCanvasEachRound: true }),
    );
  });

  it("keeps the impostor guess available in the classic mode", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.getByRole("switch", { name: /toggle impostor guessing/i }),
    ).toBeEnabled();
    expect(
      screen.queryByTestId("impostor-guess-locked"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("impostor-guess-unavailable"),
    ).not.toBeInTheDocument();
    // Nothing is locked in the classic mode
    expect(screen.queryByTestId("clear-canvas-locked")).not.toBeInTheDocument();
  });

  it("shows read-only options for non-hosts", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(
        createState({
          myId: "player-2",
          hostId: "player-1",
          gameOptions: {
            roundTime: 25,
            unlimitedInk: true,
            clearCanvasEachRound: false,
            playerColorsEnabled: true,
          },
        }),
      ),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.queryByTestId("confirm-options-button"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByText("25 seconds")).toBeInTheDocument();

    const inkSwitch = screen.getByRole("switch", { name: /toggle ink limit/i });
    const clearSwitch = screen.getByRole("switch", {
      name: /toggle canvas clearing each round/i,
    });

    const playerColorsSwitch = screen.getByRole("switch", {
      name: /toggle player colors/i,
    });

    expect(inkSwitch).toBeDisabled();
    expect(inkSwitch).toHaveAttribute("aria-checked", "true");
    expect(clearSwitch).toBeDisabled();
    expect(clearSwitch).toHaveAttribute("aria-checked", "false");
    expect(playerColorsSwitch).toBeDisabled();
    expect(playerColorsSwitch).toHaveAttribute("aria-checked", "true");
  });
});
