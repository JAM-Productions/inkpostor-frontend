import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SecretWordPanel } from "../../../src/components/result/SecretWordPanel";

describe("SecretWordPanel", () => {
  it("opens the word the game was played on", () => {
    render(<SecretWordPanel secretWord="Apple" />);

    expect(screen.getByText("The secret word was")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByTestId("no-secret-word")).not.toBeInTheDocument();
  });

  it("says so when the game ended before a word existed", () => {
    render(<SecretWordPanel secretWord={null} />);

    expect(screen.getByTestId("no-secret-word")).toHaveTextContent(
      "No word was chosen",
    );
    // The label only makes sense when there is a word under it
    expect(screen.queryByText("The secret word was")).not.toBeInTheDocument();
  });
});
