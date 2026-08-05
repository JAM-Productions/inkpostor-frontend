import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OptionsModal } from "../../../src/components/modals/OptionsModal";
import { useGameStore } from "../../../src/store/gameState";
import {
  DEFAULT_IMPOSTOR_GUESSES,
  DEFAULT_ROUND_TIME,
} from "../../../src/lib/constants";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("OptionsModal", () => {
  const mockOnClose = vi.fn();
  const mockUpdateGameOptions = vi.fn();

  const createState = (overrides = {}) => ({
    gameOptions: {
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: false,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
      hideHint: false,
      turnOrderMode: "RANDOM_STARTER",
    },
    gameMode: "CLASSIC",
    myId: "player-1",
    hostId: "player-1",
    actions: { updateGameOptions: mockUpdateGameOptions },
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
      gameMode: "CLASSIC",
      roundTime: 35,
      unlimitedInk: true,
      clearCanvasEachRound: false,
      playerColorsEnabled: true,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
      hideHint: false,
      turnOrderMode: "RANDOM_STARTER",
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
      gameMode: "CLASSIC",
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: false,
      impostorGuessEnabled: true,
      impostorGuessAttempts: 1,
      hideHint: false,
      turnOrderMode: "RANDOM_STARTER",
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

  it("stages the game mode until save, like every other option", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    await user.click(screen.getByRole("button", { name: /next game mode/i }));
    // Swiping the carousel touches nothing outside the modal
    expect(mockUpdateGameOptions).not.toHaveBeenCalled();
    expect(screen.getByText("Chaos")).toBeInTheDocument();

    await user.click(screen.getByTestId("confirm-options-button"));
    expect(mockUpdateGameOptions).toHaveBeenCalledWith({
      gameMode: "CUSTOM_WORD",
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: false,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
      hideHint: false,
      turnOrderMode: "RANDOM_STARTER",
    });
  });

  it("discards a staged mode if the host closes without saving", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    const { unmount } = render(
      <OptionsModal isOpen={true} onClose={mockOnClose} />,
    );

    await user.click(screen.getByRole("button", { name: /next game mode/i }));
    await user.click(screen.getByTestId("close-modal-button-backdrop"));

    expect(mockUpdateGameOptions).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();

    // ModalRenderer unmounts the modal on close, so reopening starts again
    // from whatever the server has — the staged mode never survives.
    unmount();
    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText("Classic")).toBeInTheDocument();
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

  it.each(["ORIGINAL", "ORIGINAL_CHAOS"])(
    "swaps the drawing options for its own ones in %s",
    (gameMode) => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(createState({ gameMode })),
      );

      render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

      expect(
        screen.queryByText("Drawing Time per Round"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("hide-hint-section")).toBeInTheDocument();
      expect(screen.getByTestId("turn-order-section")).toBeInTheDocument();
    },
  );

  it("swaps the drawing options for its own ones in the original mode", async () => {
    const user = userEvent.setup();
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState({ gameMode: "ORIGINAL" })),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    // Nothing is drawn, so these aren't shown with a padlock — they are gone
    expect(
      screen.queryByText("Drawing Time per Round"),
    ).not.toBeInTheDocument();
    [
      /toggle ink limit/i,
      /toggle player colors/i,
      /toggle canvas clearing each round/i,
      /toggle impostor guessing/i,
    ].forEach((name) =>
      expect(screen.queryByRole("switch", { name })).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId("clear-canvas-locked")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("impostor-guess-locked"),
    ).not.toBeInTheDocument();

    // ...and its own two are there instead
    expect(screen.getByTestId("hide-hint-section")).toBeInTheDocument();
    expect(screen.getByTestId("turn-order-section")).toBeInTheDocument();

    await user.click(
      screen.getByRole("switch", { name: /toggle hiding the hint/i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /the full order is drawn again/i }),
    );
    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        hideHint: true,
        turnOrderMode: "RANDOM_ORDER",
      }),
    );
  });

  it("never saves drawing settings the staged mode forces to default", async () => {
    const user = userEvent.setup();
    // The host arrives with drawing settings saved from a CLASSIC game
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(
        createState({
          gameOptions: {
            roundTime: 40,
            unlimitedInk: true,
            clearCanvasEachRound: true,
            playerColorsEnabled: true,
            impostorGuessEnabled: false,
            impostorGuessAttempts: 1,
            hideHint: false,
            turnOrderMode: "RANDOM_STARTER",
          },
        }),
      ),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    // ...and stages a mode where nothing is drawn. The carousel lives in this
    // same modal, so the locks have to follow what the host is looking at.
    await user.click(
      screen.getByRole("button", { name: /select original mode/i }),
    );
    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        gameMode: "ORIGINAL",
        roundTime: DEFAULT_ROUND_TIME,
        unlimitedInk: false,
        playerColorsEnabled: false,
        impostorGuessAttempts: DEFAULT_IMPOSTOR_GUESSES,
      }),
    );
  });

  it("hides the original-only options in every other mode", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState()),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByTestId("hide-hint-section")).not.toBeInTheDocument();
    expect(screen.queryByTestId("turn-order-section")).not.toBeInTheDocument();
  });

  it("shows the original options read-only for non-hosts", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(
        createState({
          gameMode: "ORIGINAL",
          myId: "player-2",
          hostId: "player-1",
          gameOptions: {
            roundTime: 30,
            unlimitedInk: false,
            clearCanvasEachRound: true,
            playerColorsEnabled: false,
            impostorGuessEnabled: false,
            impostorGuessAttempts: 3,
            hideHint: true,
            turnOrderMode: "FIXED_ORDER",
          },
        }),
      ),
    );

    render(<OptionsModal isOpen={true} onClose={mockOnClose} />);

    const hideHintSwitch = screen.getByRole("switch", {
      name: /toggle hiding the hint/i,
    });
    expect(hideHintSwitch).toBeDisabled();
    expect(hideHintSwitch).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByText("Fixed order")).toBeInTheDocument();
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
