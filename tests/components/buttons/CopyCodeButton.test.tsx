import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { CopyCodeButton } from "../../../src/components/buttons/CopyCodeButton";

describe("CopyCodeButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("copies the room code to clipboard when clicked", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<CopyCodeButton roomId="TESTX9" />);

    const copyCodeButton = screen.getByRole("button", { name: /testx9/i });
    await user.click(copyCodeButton);

    expect(writeTextMock).toHaveBeenCalledWith("TESTX9");
    expect(await screen.findByText(/copied!/i)).toBeInTheDocument();
  });

  it("shows the waiting state when there is no room code", () => {
    render(<CopyCodeButton roomId={null} />);

    const copyCodeButton = screen.getByRole("button", {
      name: /waiting for room code/i,
    });

    expect(copyCodeButton).toBeDisabled();
    expect(screen.getByText("------")).toBeInTheDocument();
    expect(copyCodeButton).toHaveAttribute("title", "Waiting for room code...");
  });
});