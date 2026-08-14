import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WordSelection } from "../../src/components/WordSelection";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("WordSelection", () => {
  const mockSubmitCustomWord = vi.fn();

  const createState = (overrides = {}) => ({
    myId: "player-1",
    gameMode: "CUSTOM_WORD",
    players: [
      { id: "player-1", name: "Alice", hasSubmittedWord: false },
      { id: "player-2", name: "Bob", hasSubmittedWord: false },
      { id: "player-3", name: "Charlie", hasSubmittedWord: false },
    ],
    actions: { submitCustomWord: mockSubmitCustomWord },
    ...overrides,
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState(overrides)),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form for a player who has not submitted yet", () => {
    mockStore();

    render(<WordSelection />);

    expect(screen.getByText("Write Your Word")).toBeInTheDocument();
    expect(screen.getByLabelText("Your secret word")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm word/i }),
    ).toBeInTheDocument();
  });

  it("does not ask for a drawable word in a spoken mode", () => {
    mockStore();
    const { unmount } = render(<WordSelection />);
    expect(screen.getByText(/something drawable/i)).toBeInTheDocument();
    unmount();

    mockStore({ gameMode: "ORIGINAL_CHAOS" });
    render(<WordSelection />);

    expect(screen.queryByText(/something drawable/i)).not.toBeInTheDocument();
    expect(screen.getByText(/easy to describe out loud/i)).toBeInTheDocument();
  });

  it("keeps the submit button disabled until the word is long enough", async () => {
    const user = userEvent.setup();
    mockStore();

    render(<WordSelection />);

    const submit = screen.getByRole("button", { name: /confirm word/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Your secret word"), "a");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Your secret word"), "irplane");
    expect(submit).toBeEnabled();
  });

  it("submits the typed word", async () => {
    const user = userEvent.setup();
    mockStore();

    render(<WordSelection />);

    await user.type(screen.getByLabelText("Your secret word"), "Lighthouse");
    await user.click(screen.getByRole("button", { name: /confirm word/i }));

    expect(mockSubmitCustomWord).toHaveBeenCalledWith("Lighthouse");
  });

  it("limits the word to the maximum length", () => {
    mockStore();

    render(<WordSelection />);

    expect(screen.getByLabelText("Your secret word")).toHaveAttribute(
      "maxlength",
      "40",
    );
  });

  it("shows the waiting state with the submission count once submitted", () => {
    mockStore({
      players: [
        { id: "player-1", name: "Alice", hasSubmittedWord: true },
        { id: "player-2", name: "Bob", hasSubmittedWord: true },
        { id: "player-3", name: "Charlie", hasSubmittedWord: false },
      ],
    });

    render(<WordSelection />);

    expect(screen.getByText("Your word is locked in")).toBeInTheDocument();
    expect(screen.getByText("2/3 have confirmed")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirm word/i }),
    ).not.toBeInTheDocument();
  });
});
