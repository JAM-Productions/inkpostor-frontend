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

  const createState = (overrides = {}) => ({
    gameOptions: {
      roundTime: 30,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
    },
    myId: "player-1",
    hostId: "player-1",
    actions: {
      updateGameOptions: mockUpdateGameOptions,
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
    await user.click(screen.getByTestId("confirm-options-button"));

    expect(mockUpdateGameOptions).toHaveBeenCalledWith({
      roundTime: 35,
      unlimitedInk: true,
      clearCanvasEachRound: false,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 3,
    });
    expect(mockOnClose).toHaveBeenCalled();
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
      impostorGuessEnabled: true,
      impostorGuessAttempts: 1,
    });
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

    expect(inkSwitch).toBeDisabled();
    expect(inkSwitch).toHaveAttribute("aria-checked", "true");
    expect(clearSwitch).toBeDisabled();
    expect(clearSwitch).toHaveAttribute("aria-checked", "false");
  });
});
