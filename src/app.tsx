import { ReactFlowProvider } from "@xyflow/react";
import { AppErrorBoundary } from "@/components/error-boundary/app-error-boundary";
import { Workspace } from "@/components/layout/workspace";

export function App() {
  return (
    <AppErrorBoundary>
      <ReactFlowProvider>
        <Workspace />
      </ReactFlowProvider>
    </AppErrorBoundary>
  );
}
