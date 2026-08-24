import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundToggleButton } from "../../../src/components/buttons/SoundToggleButton";
import { useSoundStore } from "../../../src/store/soundStore";

describe("SoundToggleButton", () => {
  const mockToggleMute = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSoundStore.setState({
      volume: 0.7,
      muted: false,
      actions: {
        setVolume: vi.fn(),
        setMuted: vi.fn(),
        toggleMute: mockToggleMute,
        playSound: vi.fn(),
      },
    });
  });

  it("renders unmuted state with mute aria-label", () => {
    render(<SoundToggleButton />);

    const button = screen.getByTestId("sound-toggle-btn");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Mute sound");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("renders muted state with unmute aria-label", () => {
    useSoundStore.setState({ muted: true });

    render(<SoundToggleButton />);

    const button = screen.getByTestId("sound-toggle-btn");
    expect(button).toHaveAttribute("aria-label", "Unmute sound");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles mute on click", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    const button = screen.getByTestId("sound-toggle-btn");
    await user.click(button);

    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });
});
