import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundToggleButton } from "../../../src/components/buttons/SoundToggleButton";
import { useSoundStore } from "../../../src/store/soundStore";

describe("SoundToggleButton", () => {
  const mockSetVolume = vi.fn();
  const mockSetMuted = vi.fn();
  const mockToggleMute = vi.fn();
  const mockPlaySound = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSoundStore.setState({
      volume: 0.7,
      muted: false,
      actions: {
        setVolume: mockSetVolume,
        setMuted: mockSetMuted,
        toggleMute: mockToggleMute,
        playSound: mockPlaySound,
      },
    });
  });

  it("renders sound settings button in topbar", () => {
    render(<SoundToggleButton />);

    const button = screen.getByTestId("sound-toggle-btn");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Sound settings");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("sound-popover")).not.toBeInTheDocument();
  });

  it("opens sound popover when clicked", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    const button = screen.getByTestId("sound-toggle-btn");
    await user.click(button);

    expect(screen.getByTestId("sound-popover")).toBeInTheDocument();
    expect(screen.getByText("Sound & Volume")).toBeInTheDocument();
    expect(screen.getByTestId("sound-volume-slider")).toBeInTheDocument();
    expect(screen.getByTestId("sound-volume-value")).toHaveTextContent("70%");
    expect(screen.getByTestId("sound-test-btn")).toBeEnabled();
  });

  it("toggles sound via switch inside the popover", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    await user.click(screen.getByTestId("sound-toggle-btn"));

    const soundSwitch = screen.getByRole("switch", {
      name: /toggle sound effects/i,
    });
    expect(soundSwitch).toHaveAttribute("aria-checked", "true");

    await user.click(soundSwitch);
    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });

  it("adjusts volume via the slider in the popover", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    await user.click(screen.getByTestId("sound-toggle-btn"));

    const slider = screen.getByTestId("sound-volume-slider");
    fireEvent.change(slider, { target: { value: "45" } });

    expect(mockSetVolume).toHaveBeenCalledWith(0.45);
  });

  it("plays preview sound when test button is clicked", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    await user.click(screen.getByTestId("sound-toggle-btn"));

    const testBtn = screen.getByTestId("sound-test-btn");
    await user.click(testBtn);

    expect(mockPlaySound).toHaveBeenCalledWith("testSound");
  });

  it("disables volume slider and test button when muted", async () => {
    useSoundStore.setState({
      muted: true,
      volume: 0.7,
    });

    const user = userEvent.setup();
    render(<SoundToggleButton />);

    await user.click(screen.getByTestId("sound-toggle-btn"));

    expect(screen.getByTestId("sound-volume-slider")).toBeDisabled();
    expect(screen.getByTestId("sound-volume-value")).toHaveTextContent("0%");
    expect(screen.getByTestId("sound-test-btn")).toBeDisabled();

    const soundSwitch = screen.getByRole("switch", {
      name: /toggle sound effects/i,
    });
    expect(soundSwitch).toHaveAttribute("aria-checked", "false");
  });

  it("closes popover when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <SoundToggleButton />
      </div>,
    );

    await user.click(screen.getByTestId("sound-toggle-btn"));
    expect(screen.getByTestId("sound-popover")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside-area"));
    expect(screen.queryByTestId("sound-popover")).not.toBeInTheDocument();
  });
});
