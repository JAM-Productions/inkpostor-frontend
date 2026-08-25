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
  const mockSetMusicVolume = vi.fn();
  const mockSetMusicEnabled = vi.fn();
  const mockSetMusicTrack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSoundStore.setState({
      volume: 0.7,
      muted: false,
      musicVolume: 0.45,
      musicEnabled: true,
      musicTrack: null,
      actions: {
        setVolume: mockSetVolume,
        setMuted: mockSetMuted,
        toggleMute: mockToggleMute,
        playSound: mockPlaySound,
        setMusicVolume: mockSetMusicVolume,
        setMusicEnabled: mockSetMusicEnabled,
        setMusicTrack: mockSetMusicTrack,
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

  it("aligns popover to right wall in mobile screens and prevents out-of-bounds overflow", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    await user.click(screen.getByTestId("sound-toggle-btn"));
    const popover = screen.getByTestId("sound-popover");

    // Responsive classes: fixed right-3 on mobile to stay within bounds, sm:absolute sm:right-0 on desktop
    expect(popover.className).toContain("fixed");
    expect(popover.className).toContain("right-3");
    expect(popover.className).toContain("max-w-[calc(100vw-1.5rem)]");
    expect(popover.className).toContain("sm:absolute");
    expect(popover.className).toContain("sm:right-0");
  });

  it("does not render an icon in the header next to the title, maintaining only the volume bar icon", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    await user.click(screen.getByTestId("sound-toggle-btn"));
    const title = screen.getByTestId("sound-popover-title");

    // Header container contains the title and switch, without any preceding svg icon
    expect(title.parentElement?.querySelector("svg")).toBeNull();

    // The volume slider row retains its volume icon
    const slider = screen.getByTestId("sound-volume-slider");
    const sliderRow = slider.parentElement;
    expect(sliderRow?.querySelector("svg")).not.toBeNull();
  });

  it("prevents the sound label from splitting across multiple lines with whitespace-nowrap", async () => {
    const user = userEvent.setup();
    render(<SoundToggleButton />);

    await user.click(screen.getByTestId("sound-toggle-btn"));
    const title = screen.getByTestId("sound-popover-title");

    expect(title).toHaveClass("whitespace-nowrap");
  });

  describe("music controls", () => {
    const openPopover = async () => {
      const user = userEvent.setup();
      render(<SoundToggleButton />);
      await user.click(screen.getByTestId("sound-toggle-btn"));
      return user;
    };

    it("closes the effects section with its test button, then the music one", async () => {
      await openPopover();

      const order = [
        "sound-popover-title",
        "sound-volume-slider",
        "sound-test-btn",
        "music-volume-slider",
      ].map((id) => screen.getByTestId(id));

      order.slice(1).forEach((el, i) => {
        // DOCUMENT_POSITION_FOLLOWING: each one comes after the previous
        expect(
          order[i].compareDocumentPosition(el) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      });
    });

    it("turns the music off from its own switch", async () => {
      const user = await openPopover();

      await user.click(
        screen.getByRole("switch", { name: /toggle background music/i }),
      );

      expect(mockSetMusicEnabled).toHaveBeenCalledWith(false);
      // The effects are left alone: the two switches are independent
      expect(mockToggleMute).not.toHaveBeenCalled();
    });

    it("keeps a music level separate from the effects one", async () => {
      await openPopover();

      fireEvent.change(screen.getByTestId("music-volume-slider"), {
        target: { value: "20" },
      });

      expect(mockSetMusicVolume).toHaveBeenCalledWith(0.2);
      expect(mockSetVolume).not.toHaveBeenCalled();
      expect(screen.getByTestId("music-volume-value")).toHaveTextContent("45%");
    });

    it("shows the music as off and locked while the master mute is on", async () => {
      useSoundStore.setState({ muted: true });
      await openPopover();

      const slider = screen.getByTestId("music-volume-slider");
      expect(slider).toBeDisabled();
      expect(screen.getByTestId("music-volume-value")).toHaveTextContent("0%");
      expect(
        screen.getByRole("switch", { name: /toggle background music/i }),
      ).toBeDisabled();
    });

    it("greys the music level out when only the music is off", async () => {
      useSoundStore.setState({ musicEnabled: false });
      await openPopover();

      expect(screen.getByTestId("music-volume-slider")).toBeDisabled();
      // ...while the effects keep working
      expect(screen.getByTestId("sound-volume-slider")).not.toBeDisabled();
    });
  });
});
