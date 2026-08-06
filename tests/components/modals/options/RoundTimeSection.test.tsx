import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoundTimeSection } from "../../../../src/components/modals/options/RoundTimeSection";

describe("RoundTimeSection", () => {
  it("lets the host select a round time", () => {
    const onChange = vi.fn();
    render(<RoundTimeSection isHost onChange={onChange} roundTime={30} />);

    fireEvent.click(screen.getByRole("radio", { name: /35 seconds/i }));
    expect(onChange).toHaveBeenCalledWith(35);
  });

  it("renders the selected value read-only for guests", () => {
    render(
      <RoundTimeSection isHost={false} onChange={vi.fn()} roundTime={25} />,
    );

    expect(screen.getByText("25 seconds")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });
});
