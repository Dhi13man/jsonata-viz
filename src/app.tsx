import { useState, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { AppErrorBoundary } from "@/components/error-boundary/app-error-boundary";
import { Workspace } from "@/components/layout/workspace";
import { MobileEvaluator } from "@/components/layout/mobile-evaluator";
import { useExpressionSync } from "@/hooks/use-expression-sync";
import { useUrlSharing } from "@/hooks/use-url-sharing";

function useMobileBreakpoint(maxWidth = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < maxWidth,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [maxWidth]);

  return isMobile;
}

/** Mobile-only shell that still runs the eval pipeline */
function MobileApp() {
  useExpressionSync();
  useUrlSharing();
  return <MobileEvaluator />;
}

export function App() {
  const isMobile = useMobileBreakpoint();

  return (
    <AppErrorBoundary>
      {isMobile ? (
        <MobileApp />
      ) : (
        <ReactFlowProvider>
          <Workspace />
        </ReactFlowProvider>
      )}
    </AppErrorBoundary>
  );
}
