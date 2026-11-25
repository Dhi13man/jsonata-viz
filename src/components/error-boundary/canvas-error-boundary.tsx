import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CanvasErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
          }}
        >
          <p className="text-sm font-medium">
            Canvas error — text editor still available
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="cursor-pointer rounded-md border px-3 py-1.5 text-xs"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-primary)",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
