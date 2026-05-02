import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );
    vi.clearAllMocks();
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
        },
        errorMessage: null,
        myName: null,
        isCheckingHealth: false,
        serviceOnline: true,
      };
      return selector(state);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('disables "Create New Game" when name is empty', () => {
    render(<JoinScreen />);

    const createButton = screen.getByRole("button", {
      name: /create new game/i,
    });
    expect(createButton).toBeDisabled();
  });

  it("disables inputs and buttons while checking service health", async () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
        },
        errorMessage: null,
        myName: null,
        isCheckingHealth: true,
        serviceOnline: false,
      };
      return selector(state);
    });

    render(<JoinScreen />);

    expect(
      screen.getByText("Checking the service status..."),
    ).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(
      "Enter your name",
    ) as HTMLInputElement;
    const roomInput = screen.getByPlaceholderText(
      "E.g. X7K9A2",
    ) as HTMLInputElement;
    const createButton = screen.getByRole("button", {
      name: /create new game/i,
    });
    const joinButton = screen.getByRole("button", { name: /join game/i });

    expect(nameInput.disabled).toBe(true);
    expect(roomInput.disabled).toBe(true);
    expect(createButton).toBeDisabled();
    expect(joinButton).toBeDisabled();
  });

  it('enables "Create New Game" when name is entered and calls connectAndCreate', async () => {
    const user = userEvent.setup();
    render(<JoinScreen />);

    // Wait for health check to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Checking the service status..."),
      ).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const createButton = screen.getByRole("button", {
      name: /create new game/i,
    });

    await user.type(nameInput, "Player1");
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });

    await user.click(createButton);
    expect(mockConnectAndCreate).toHaveBeenCalledWith(
      expect.any(String),
      "Player1",
    );
  });

  it("disables create button even with name entered while service is offline", async () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
        },
        errorMessage: null,
        myName: null,
        isCheckingHealth: false,
        serviceOnline: false,
      };
      return selector(state);
    });

    render(<JoinScreen />);

    expect(
      screen.getByText("The service is currently unavailable"),
    ).toBeInTheDocument();

    // Form should not be visible when offline
    expect(
      screen.queryByPlaceholderText("Enter your name"),
    ).not.toBeInTheDocument();
  });

  it('disables "Join Game" when inputs are empty or partially empty', async () => {
    const user = userEvent.setup();
    render(<JoinScreen />);

    // Wait for health check to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Checking the service status..."),
      ).not.toBeInTheDocument();
    });

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

    // Wait for health check to complete
    await waitFor(() => {
      expect(
        screen.queryByText("Checking the service status..."),
      ).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const roomInput = screen.getByPlaceholderText("E.g. X7K9A2");
    const joinButton = screen.getByRole("button", { name: /join game/i });

    await user.type(nameInput, "Player1");
    await user.type(roomInput, "room12");

    await waitFor(() => {
      expect(joinButton).toBeEnabled();
    });

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
        isCheckingHealth: false,
        serviceOnline: true,
      };
      return selector(state);
    });

    render(<JoinScreen />);

    expect(
      screen.getByText("Test error connection failed"),
    ).toBeInTheDocument();
  });

  it("pre-fills the name if present in store", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
        },
        errorMessage: null,
        myName: "SavedName",
        isCheckingHealth: false,
        serviceOnline: true,
      };
      return selector(state);
    });

    render(<JoinScreen />);

    const nameInput = screen.getByPlaceholderText(
      "Enter your name",
    ) as HTMLInputElement;
    expect(nameInput.value).toBe("SavedName");
  });

  describe("URL room parameter", () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          search: "?room=AB12CD",
        },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    });

    it("pre-fills the room code from URL parameter", async () => {
      render(<JoinScreen />);

      const roomInput = screen.getByPlaceholderText(
        "E.g. X7K9A2",
      ) as HTMLInputElement;
      expect(roomInput.value).toBe("AB12CD");
    });


    it("does not auto-join if myName is not present", async () => {
      render(<JoinScreen />);

      expect(
        screen.queryByText("Checking the service status..."),
      ).not.toBeInTheDocument();

      expect(mockConnectAndJoin).not.toHaveBeenCalled();
    });
  });

  describe("Service Health Check", () => {
    it("shows 'Checking the service status...' when isCheckingHealth is true", () => {
      (useGameStore as any).mockImplementation((selector: any) => {
        const state = {
          actions: {
            connectAndCreate: mockConnectAndCreate,
            connectAndJoin: mockConnectAndJoin,
          },
          errorMessage: null,
          myName: null,
          isCheckingHealth: true,
          serviceOnline: false,
        };
        return selector(state);
      });

      render(<JoinScreen />);

      expect(
        screen.getByText("Checking the service status..."),
      ).toBeInTheDocument();
    });

    it("hides form and shows offline message when isCheckingHealth is false and serviceOnline is false", () => {
      (useGameStore as any).mockImplementation((selector: any) => {
        const state = {
          actions: {
            connectAndCreate: mockConnectAndCreate,
            connectAndJoin: mockConnectAndJoin,
          },
          errorMessage: null,
          myName: null,
          isCheckingHealth: false,
          serviceOnline: false,
        };
        return selector(state);
      });

      render(<JoinScreen />);

      expect(
        screen.getByText("The service is currently unavailable"),
      ).toBeInTheDocument();

      // Form elements should not be visible
      expect(
        screen.queryByPlaceholderText("Enter your name"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("E.g. X7K9A2"),
      ).not.toBeInTheDocument();
    });
  });
});
