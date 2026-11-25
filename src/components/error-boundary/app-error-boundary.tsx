import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "16px",
            fontFamily: "Inter, system-ui, sans-serif",
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-canvas)",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            Visionata encountered an unexpected error. Your expression and input
            data are saved in localStorage.
          </p>
          <pre
            style={{
              fontSize: "12px",
              color: "var(--color-error, #F85149)",
              backgroundColor: "var(--bg-surface)",
              padding: "12px 16px",
              borderRadius: "8px",
              maxWidth: "600px",
              overflow: "auto",
            }}
          >
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
