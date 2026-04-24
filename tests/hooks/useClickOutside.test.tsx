import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useClickOutside } from "../../src/hooks/useClickOutside";

type TestDropdownProps = {
  isOpen: boolean;
  setIsOpen?: (isOpen: boolean) => void;
};

const TestDropdown = ({ isOpen, setIsOpen = vi.fn() }: TestDropdownProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, isOpen, setIsOpen);

  return (
    <div>
      <div ref={ref} data-testid="inside">
        Inside
      </div>
      <div data-testid="outside">Outside</div>
    </div>
  );
};

describe("useClickOutside", () => {
  it("calls setIsOpen(false) when clicking outside an open element", () => {
    const setIsOpen = vi.fn();

    render(<TestDropdown isOpen={true} setIsOpen={setIsOpen} />);

    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(setIsOpen).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it("does not call setIsOpen when clicking inside the referenced element", () => {
    const setIsOpen = vi.fn();

    render(<TestDropdown isOpen={true} setIsOpen={setIsOpen} />);

    fireEvent.mouseDown(screen.getByTestId("inside"));

    expect(setIsOpen).not.toHaveBeenCalled();
  });

  it("does not call setIsOpen when the element is closed", () => {
    const setIsOpen = vi.fn();

    render(<TestDropdown isOpen={false} setIsOpen={setIsOpen} />);

    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(setIsOpen).not.toHaveBeenCalled();
  });
});
