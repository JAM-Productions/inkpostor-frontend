import { render, screen } from "@testing-library/react";
import { Circle } from "lucide-react";
import { describe, expect, it } from "vitest";
import { OptionSection } from "../../../../src/components/modals/options/OptionSection";

describe("OptionSection", () => {
  it("renders the option heading, description and content", () => {
    render(
      <OptionSection
        icon={<Circle />}
        iconClassName="text-blue-400"
        title="Section title"
        description="Section description"
        testId="option-section"
      >
        <button type="button">Action</button>
      </OptionSection>,
    );

    expect(screen.getByTestId("option-section")).toHaveTextContent(
      "Section title",
    );
    expect(screen.getByText("Section description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});
