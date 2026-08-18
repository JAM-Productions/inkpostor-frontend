import { Component, type ErrorInfo, type ReactNode } from "react";

interface ModalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: unknown;
}

interface ModalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ModalErrorBoundary extends Component<
  ModalErrorBoundaryProps,
  ModalErrorBoundaryState
> {
  public override state: ModalErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(
    error: Error,
  ): ModalErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV !== "production") {
      console.error("ModalErrorBoundary caught an error:", error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  public override componentDidUpdate(prevProps: ModalErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
