import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { JoinScreen } from "../../src/components/JoinScreen";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("JoinScreen", () => {
  const mockConnectAndCreate = vi.fn();
  const mockConnectAndJoin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
        },
        errorMessage: null,
      };
      return selector(state);
    });
  });

  it("renders the initial screen with inputs and buttons", () => {
    render(<JoinScreen />);

    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create new game/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("E.g. X7K9A2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join game/i }),
    ).toBeInTheDocument();
  });

  it('disables "Create New Game" heavily when name is empty', () => {
    render(<JoinScreen />);

    const createButton = screen.getByRole("button", {
      name: /create new game/i,
    });
    expect(createButton).toBeDisabled();
  });

  it('enables "Create New Game" when name is entered and calls connectAndCreate', async () => {
    const user = userEvent.setup();
    render(<JoinScreen />);

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const createButton = screen.getByRole("button", {
      name: /create new game/i,
    });

    await user.type(nameInput, "Player1");
    expect(createButton).toBeEnabled();

    await user.click(createButton);
    expect(mockConnectAndCreate).toHaveBeenCalledWith(
      expect.any(String),
      "Player1",
    );
  });

  it('disables "Join Game" when inputs are empty or partially empty', async () => {
    const user = userEvent.setup();
    render(<JoinScreen />);

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const roomInput = screen.getByPlaceholderText("E.g. X7K9A2");
    const joinButton = screen.getByRole("button", { name: /join game/i });

    expect(joinButton).toBeDisabled();

    await user.type(nameInput, "Player1");
    expect(joinButton).toBeDisabled();

    await user.clear(nameInput);
    await user.type(roomInput, "ROOMID");
    expect(joinButton).toBeDisabled();
  });

  it('enables "Join Game" when both inputs are entered and calls connectAndJoin', async () => {
    const user = userEvent.setup();
    render(<JoinScreen />);

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const roomInput = screen.getByPlaceholderText("E.g. X7K9A2");
    const joinButton = screen.getByRole("button", { name: /join game/i });

    await user.type(nameInput, "Player1");
    await user.type(roomInput, "room12");

    expect(joinButton).toBeEnabled();

    await user.click(joinButton);
    // Component explicitly uppercases room ID
    expect(mockConnectAndJoin).toHaveBeenCalledWith("ROOM12", "Player1");
  });

  it("displays error message if present in store", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
        },
        errorMessage: "Test error connection failed",
      };
      return selector(state);
    });

    render(<JoinScreen />);

    expect(
      screen.getByText("Test error connection failed"),
    ).toBeInTheDocument();
  });
});
