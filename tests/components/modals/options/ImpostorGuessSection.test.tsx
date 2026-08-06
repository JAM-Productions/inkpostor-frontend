import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImpostorGuessSection } from "../../../../src/components/modals/options/ImpostorGuessSection";

const createProps = () => ({
  attempts: 2,
  enabled: true,
  isHost: true,
  isLocked: false,
  losesWhenOutOfGuesses: false,
  modeName: "Classic",
  onAttemptsChange: vi.fn(),
  onEnabledChange: vi.fn(),
  onLosesWhenOutOfGuessesChange: vi.fn(),
});

describe("ImpostorGuessSection", () => {
  it("delegates feature, attempt and lethal-pool changes", () => {
    const props = createProps();
    render(<ImpostorGuessSection {...props} />);

    fireEvent.click(
      screen.getByRole("switch", { name: /toggle impostor guessing/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /increase attempts/i }));
    fireEvent.click(
      screen.getByRole("switch", {
        name: /toggle losing on the last attempt/i,
      }),
    );

    expect(props.onEnabledChange).toHaveBeenCalledOnce();
    expect(props.onAttemptsChange).toHaveBeenCalledWith(1);
    expect(props.onLosesWhenOutOfGuessesChange).toHaveBeenCalledOnce();
  });

  it("does not render subordinate controls while guessing is disabled", () => {
    render(<ImpostorGuessSection {...createProps()} enabled={false} />);

    expect(screen.queryByText("Number of attempts")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("impostor-lose-on-last-attempt"),
    ).not.toBeInTheDocument();
  });

  it("shows the mode lock instead of the main switch", () => {
    render(
      <ImpostorGuessSection
        {...createProps()}
        isLocked
        modeName="Custom Word"
      />,
    );

    expect(
      screen.queryByRole("switch", { name: /toggle impostor guessing/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("impostor-guess-locked")).toBeInTheDocument();
    expect(screen.getByTestId("impostor-guess-unavailable")).toHaveTextContent(
      "Custom Word",
    );
  });
});
