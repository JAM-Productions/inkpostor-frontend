import { fireEvent, render, screen } from "@testing-library/react";
import { Droplets } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ToggleOptionSection } from "../../../../src/components/modals/options/ToggleOptionSection";

describe("ToggleOptionSection", () => {
  it("renders the passed copy and calls onChange from its switch", () => {
    const onChange = vi.fn();
    render(
      <ToggleOptionSection
        checked={false}
        disabled={false}
        icon={<Droplets />}
        iconClassName="text-emerald-400"
        title="Ink"
        description="Use all the ink"
        label="Toggle ink"
        onChange={onChange}
        tone="emerald"
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Toggle ink" }));
    expect(screen.getByText("Use all the ink")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledOnce();
  });
});
