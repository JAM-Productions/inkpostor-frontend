import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoomCodeButton } from "../../../src/components/buttons/RoomCodeButton";

describe("RoomCodeButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("copies the room code when clicked", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("navigator", {
      clipboard: { writeText: writeTextMock },
    });

    render(<RoomCodeButton roomId="TESTX9" />);

    await user.click(screen.getByTestId("topbar-room-code"));

    expect(writeTextMock).toHaveBeenCalledWith("TESTX9");
    expect(await screen.findByText(/copied!/i)).toBeInTheDocument();
  });
});
