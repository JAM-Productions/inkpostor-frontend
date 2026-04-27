import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CopyLinkButton } from "../../../src/components/buttons/CopyLinkButton";

describe("CopyLinkButton", () => {
  it("copies the room link to clipboard when clicked", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        pathname: "/",
      },
      writable: true,
    });

    render(<CopyLinkButton roomId="TESTX9" />);

    const copyLinkButton = screen.getByRole("button", { name: /copy link/i });
    await user.click(copyLinkButton);

    expect(writeTextMock).toHaveBeenCalledWith(
      "http://localhost:3000/?room=TESTX9",
    );
  });
});
