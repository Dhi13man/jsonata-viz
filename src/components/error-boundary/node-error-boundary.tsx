import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  nodeId: string;
}

interface State {
  hasError: boolean;
}

export class NodeErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[NodeErrorBoundary:${this.props.nodeId}]`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--color-error)",
            color: "var(--color-error)",
          }}
        >
          Error
        </div>
      );
    }
    return this.props.children;
  }
}
