import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VoteDotsPreview } from "../../src/components/VoteDotsPreview";

describe("VoteDotsPreview", () => {
  it("renders nothing if count is 0", () => {
    const { container } = render(
      <VoteDotsPreview count={0} testId="test-dot" isSelected={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the correct number of dots", () => {
    render(<VoteDotsPreview count={3} testId="test-dot" isSelected={false} />);
    const dots = screen.getAllByTestId("test-dot");
    expect(dots).toHaveLength(3);
  });

  it("applies the correct styling when not selected", () => {
    render(<VoteDotsPreview count={1} testId="test-dot" isSelected={false} />);
    const dot = screen.getByTestId("test-dot");
    expect(dot.className).toContain("bg-stone-500/70");
    expect(dot.className).not.toContain("bg-white/80");
  });

  it("applies the correct styling when selected", () => {
    render(<VoteDotsPreview count={1} testId="test-dot" isSelected={true} />);
    const dot = screen.getByTestId("test-dot");
    expect(dot.className).toContain("bg-white/80");
    expect(dot.className).not.toContain("bg-stone-500/70");
  });
});
