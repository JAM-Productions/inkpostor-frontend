import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ModalErrorBoundary } from "../../../src/components/modals/ModalErrorBoundary";

const CrashingComponent = () => {
  throw new Error("Failed to load chunk");
};

describe("ModalErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ModalErrorBoundary>
        <div data-testid="child">Child Content</div>
      </ModalErrorBoundary>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("catches error in child and invokes onError callback", () => {
    const onError = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ModalErrorBoundary onError={onError}>
        <CrashingComponent />
      </ModalErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("resets error state when resetKey changes", () => {
    const onError = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <ModalErrorBoundary resetKey="modal1" onError={onError}>
        <CrashingComponent />
      </ModalErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);

    // Rerender with new resetKey and healthy child
    rerender(
      <ModalErrorBoundary resetKey="modal2" onError={onError}>
        <div data-testid="recovered-child">Recovered</div>
      </ModalErrorBoundary>,
    );

    expect(screen.getByTestId("recovered-child")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
