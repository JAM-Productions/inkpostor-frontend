import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JoinScreen } from "../../src/components/JoinScreen";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: Object.assign(vi.fn(), {
    getState: vi.fn(),
  }),
}));

describe("JoinScreen", () => {
  const mockConnectAndCreate = vi.fn();
  const mockConnectAndJoin = vi.fn();
  const mockCheckHealth = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );
    vi.clearAllMocks();

    const defaultState = {
      actions: {
        connectAndCreate: mockConnectAndCreate,
        connectAndJoin: mockConnectAndJoin,
        checkHealth: mockCheckHealth,
      },
      errorMessage: null,
      myName: null,
      serviceOnline: true,
      isCheckingHealth: false,
    };

    (useGameStore as any).mockImplementation((selector: any) =>
      selector(defaultState),
    );
    (useGameStore.getState as any).mockReturnValue(defaultState);
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
    const state = {
      actions: {
        connectAndCreate: mockConnectAndCreate,
        connectAndJoin: mockConnectAndJoin,
        checkHealth: mockCheckHealth,
      },
      errorMessage: null,
      myName: null,
      serviceOnline: false,
      isCheckingHealth: true,
    };
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(state),
    );
    (useGameStore.getState as any).mockReturnValue(state);

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

  it("shows offline message when service is offline", async () => {
    const state = {
      actions: {
        connectAndCreate: mockConnectAndCreate,
        connectAndJoin: mockConnectAndJoin,
        checkHealth: mockCheckHealth,
      },
      errorMessage: null,
      myName: null,
      serviceOnline: false,
      isCheckingHealth: false,
    };
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(state),
    );
    (useGameStore.getState as any).mockReturnValue(state);

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
    const state = {
      actions: {
        connectAndCreate: mockConnectAndCreate,
        connectAndJoin: mockConnectAndJoin,
        checkHealth: mockCheckHealth,
      },
      errorMessage: "Test error connection failed",
      serviceOnline: true,
      isCheckingHealth: false,
    };
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(state),
    );
    (useGameStore.getState as any).mockReturnValue(state);

    render(<JoinScreen />);

    expect(
      screen.getByText("Test error connection failed"),
    ).toBeInTheDocument();
  });

  it("pre-fills the name if present in store", () => {
    const state = {
      actions: {
        connectAndCreate: mockConnectAndCreate,
        connectAndJoin: mockConnectAndJoin,
        checkHealth: mockCheckHealth,
      },
      errorMessage: null,
      myName: "SavedName",
      serviceOnline: true,
      isCheckingHealth: false,
    };
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(state),
    );
    (useGameStore.getState as any).mockReturnValue(state);

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

    it("auto-joins when myName is present and service is online", async () => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
          checkHealth: mockCheckHealth,
        },
        errorMessage: null,
        myName: "PlayerFromStore",
        serviceOnline: true,
        isCheckingHealth: false,
      };
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(state),
      );
      (useGameStore.getState as any).mockReturnValue(state);

      render(<JoinScreen />);

      await waitFor(() => {
        expect(mockConnectAndJoin).toHaveBeenCalledWith(
          "AB12CD",
          "PlayerFromStore",
        );
      });
    });

    it("does not auto-join if myName is not present", async () => {
      render(<JoinScreen />);

      await waitFor(() => {
        expect(
          screen.queryByText("Checking the service status..."),
        ).not.toBeInTheDocument();
      });

      expect(mockConnectAndJoin).not.toHaveBeenCalled();
    });
  });

  describe("Service Health Check", () => {
    it("shows 'Checking the service status...' when isCheckingHealth is true", async () => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
          checkHealth: mockCheckHealth,
        },
        errorMessage: null,
        myName: null,
        serviceOnline: false,
        isCheckingHealth: true,
      };
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(state),
      );
      (useGameStore.getState as any).mockReturnValue(state);

      render(<JoinScreen />);

      expect(
        screen.getByText("Checking the service status..."),
      ).toBeInTheDocument();
    });

    it("shows offline message when service is offline", async () => {
      const state = {
        actions: {
          connectAndCreate: mockConnectAndCreate,
          connectAndJoin: mockConnectAndJoin,
          checkHealth: mockCheckHealth,
        },
        errorMessage: null,
        myName: null,
        serviceOnline: false,
        isCheckingHealth: false,
      };
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(state),
      );
      (useGameStore.getState as any).mockReturnValue(state);

      render(<JoinScreen />);

      expect(
        screen.getByText("The service is currently unavailable"),
      ).toBeInTheDocument();

      // Form elements should not be visible
      expect(
        screen.queryByPlaceholderText("Enter your name"),
      ).not.toBeInTheDocument();
    });

    it("calls checkHealth on mount", async () => {
      render(<JoinScreen />);

      await waitFor(() => {
        expect(mockCheckHealth).toHaveBeenCalled();
      });
    });
  });
});
