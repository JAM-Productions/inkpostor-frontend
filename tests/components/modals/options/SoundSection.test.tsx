import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundSection } from "../../../../src/components/modals/options/SoundSection";
import { useSoundStore } from "../../../../src/store/soundStore";

describe("SoundSection", () => {
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

  it("renders sound title, description, and controls", () => {
    render(<SoundSection />);

    expect(screen.getByTestId("sound-section")).toBeInTheDocument();
    expect(screen.getByText("Sound & Volume")).toBeInTheDocument();
    expect(
      screen.getByText("Adjust game sound effects and master volume."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("sound-volume-slider")).toBeInTheDocument();
    expect(screen.getByTestId("sound-volume-value")).toHaveTextContent("70%");
    expect(screen.getByTestId("sound-test-btn")).toBeEnabled();
  });

  it("toggles mute when the switch is clicked", async () => {
    const user = userEvent.setup();
    render(<SoundSection />);

    const muteSwitch = screen.getByRole("switch", {
      name: /toggle sound mute/i,
    });
    expect(muteSwitch).toHaveAttribute("aria-checked", "false");

    await user.click(muteSwitch);
    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });

  it("updates volume when the slider is moved", () => {
    render(<SoundSection />);

    const slider = screen.getByTestId("sound-volume-slider");
    fireEvent.change(slider, { target: { value: "45" } });

    expect(mockSetVolume).toHaveBeenCalledWith(0.45);
  });

  it("disables volume slider and test button when muted", () => {
    useSoundStore.setState({
      muted: true,
      volume: 0.7,
    });

    render(<SoundSection />);

    expect(screen.getByTestId("sound-volume-slider")).toBeDisabled();
    expect(screen.getByTestId("sound-volume-value")).toHaveTextContent("0%");
    expect(screen.getByTestId("sound-test-btn")).toBeDisabled();
  });

  it("plays test sound when test button is clicked", async () => {
    const user = userEvent.setup();
    render(<SoundSection />);

    const testBtn = screen.getByTestId("sound-test-btn");
    await user.click(testBtn);

    expect(mockPlaySound).toHaveBeenCalledWith("testSound");
  });
});
