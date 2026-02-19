/**
 * First-run onboarding overlay — Phase 1.11.
 * 3-step walkthrough that appears on first visit.
 * Dismissible, stores completion in localStorage.
 */

import { useState, useCallback } from "react";
import { X, ArrowRight, Sparkles, Eye, Share2 } from "lucide-react";

const STORAGE_KEY = "visionata-onboarding-complete";

function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch { /* storage unavailable */ }
}

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles size={24} />,
    title: "Write JSONata expressions",
    description:
      "Type or paste a JSONata expression in the bottom panel. The visual graph updates in real-time as you type.",
  },
  {
    icon: <Eye size={24} />,
    title: "Visualize and explore",
    description:
      "Each node in the graph represents part of your expression. Click nodes to see sub-expression results. Drag to rearrange.",
  },
  {
    icon: <Share2 size={24} />,
    title: "Share your work",
    description:
      "Click Share to generate a URL with your expression. Everything runs locally in your browser — no data leaves your machine.",
  },
];

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(() => !isOnboardingComplete());
  const [step, setStep] = useState(0);

  const dismiss = useCallback(() => {
    markComplete();
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!visible) return null;

  const current = STEPS[step]!;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: "var(--bg-overlay)",
        zIndex: "var(--z-overlay)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Visionata"
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-xl p-6 shadow-lg"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 cursor-pointer rounded-md border-none bg-transparent p-1 transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Skip onboarding"
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div className="mb-4 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor:
                  i <= step ? "var(--border-active)" : "var(--border-default)",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--border-active)",
            }}
          >
            {current.icon}
          </div>
          <h2
            className="mb-2 text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {current.title}
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={dismiss}
            className="cursor-pointer border-none bg-transparent px-3 py-1.5 text-xs transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            Skip
          </button>
          <button
            onClick={next}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors"
            style={{
              backgroundColor: "var(--border-active)",
              border: "none",
            }}
            aria-label={step < STEPS.length - 1 ? "Next step" : "Get started"}
          >
            {step < STEPS.length - 1 ? (
              <>
                Next <ArrowRight size={14} />
              </>
            ) : (
              "Get started"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
