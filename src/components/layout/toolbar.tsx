import { useCallback, useState, useRef, useEffect } from "react";
import {
  Share2,
  Moon,
  Sun,
  RotateCcw,
  Undo2,
  Redo2,
  PanelLeftOpen,
  PanelRightOpen,
  Search,
  FileText,
  FlaskConical,
  Columns3,
  Monitor,
  LayoutList,
  GitCompareArrows,
  Clock,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useEditorStore } from "@/stores/editor-store";
import { useFlowStore } from "@/stores/flow-store";
import { encodeShareUrl } from "@/lib/utils/lz-url";
import { TEMPLATES, type Template } from "@/lib/templates";
import { claimOrigin } from "@/stores/sync-coordinator";
import type { BottomTab } from "./workspace";

interface ToolbarProps {
  onToggleCommandPalette: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  bottomTab: BottomTab;
  onBottomTabChange: (tab: BottomTab) => void;
}

export function Toolbar({
  onToggleCommandPalette,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  bottomTab,
  onBottomTabChange,
}: ToolbarProps) {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const layoutPreset = useUIStore((s) => s.layoutPreset);
  const setLayoutPreset = useUIStore((s) => s.setLayoutPreset);
  const expression = useEditorStore((s) => s.expression);

  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Close template dropdown on outside click
  useEffect(() => {
    if (!templateOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        templateRef.current &&
        !templateRef.current.contains(e.target as Node)
      ) {
        setTemplateOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [templateOpen]);

  const handleShare = useCallback(() => {
    const { inputJson } = useEditorStore.getState();
    const url = encodeShareUrl({ expression, input: inputJson });
    if (!url) return;
    navigator.clipboard.writeText(url).catch(() => {
      window.prompt("Copy this URL:", url);
    });
  }, [expression]);

  const handleReset = useCallback(() => {
    claimOrigin("text");
    useEditorStore.getState().setExpression("Account.Order.Product.Price");
  }, []);

  const handleUndo = useCallback(() => {
    useFlowStore.temporal.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useFlowStore.temporal.getState().redo();
  }, []);

  const handleTemplate = useCallback((t: Template) => {
    claimOrigin("text");
    useEditorStore.getState().setExpression(t.expression);
    useEditorStore.getState().setInputJson(t.sampleInput);
    setTemplateOpen(false);
  }, []);

  const layoutIcon =
    layoutPreset === "graph" ? (
      <Monitor size={14} />
    ) : layoutPreset === "text" ? (
      <LayoutList size={14} />
    ) : (
      <Columns3 size={14} />
    );

  const nextLayout = useCallback(() => {
    const presets = ["graph", "text", "split"] as const;
    const current = layoutPreset ?? "split";
    const idx = presets.indexOf(current);
    setLayoutPreset(presets[(idx + 1) % presets.length]!);
  }, [layoutPreset, setLayoutPreset]);

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b px-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Left: Logo + title */}
      <div className="flex items-center gap-2">
        <img
          src="/visionata.svg"
          alt=""
          className="h-6 w-6"
          width={24}
          height={24}
        />
        <h1
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Visionata
        </h1>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-tertiary)",
            border: "1px solid var(--border-default)",
          }}
        >
          alpha
        </span>
      </div>

      {/* Center: Layout controls + bottom tab switcher */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<PanelLeftOpen size={16} />}
          label="Toggle palette"
          onClick={onToggleLeftSidebar}
        />
        <ToolbarButton
          icon={layoutIcon}
          label={`Layout: ${layoutPreset}`}
          onClick={nextLayout}
        />
        <ToolbarButton
          icon={<PanelRightOpen size={16} />}
          label="Toggle properties"
          onClick={onToggleRightSidebar}
        />

        <div
          className="mx-2 h-5 w-px"
          style={{ backgroundColor: "var(--border-default)" }}
        />

        {/* Bottom tab switcher */}
        <ToolbarButton
          icon={<FileText size={16} />}
          label="Editors"
          onClick={() => onBottomTabChange("editors")}
          active={bottomTab === "editors"}
        />
        <ToolbarButton
          icon={<FlaskConical size={16} />}
          label="Tests"
          onClick={() => onBottomTabChange("tests")}
          active={bottomTab === "tests"}
        />
        <ToolbarButton
          icon={<GitCompareArrows size={16} />}
          label="Diff"
          onClick={() => onBottomTabChange("diff")}
          active={bottomTab === "diff"}
        />
        <ToolbarButton
          icon={<Clock size={16} />}
          label="History"
          onClick={() => onBottomTabChange("history")}
          active={bottomTab === "history"}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Undo2 size={16} />}
          label="Undo (Ctrl+Z)"
          onClick={handleUndo}
        />
        <ToolbarButton
          icon={<Redo2 size={16} />}
          label="Redo (Ctrl+Shift+Z)"
          onClick={handleRedo}
        />

        <div
          className="mx-1 h-5 w-px"
          style={{ backgroundColor: "var(--border-default)" }}
        />

        {/* Template picker */}
        <div className="relative" ref={templateRef}>
          <ToolbarButton
            icon={<FileText size={16} />}
            label="Templates"
            onClick={() => setTemplateOpen((v) => !v)}
          />
          {templateOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div className="max-h-80 overflow-y-auto">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplate(t)}
                    className="flex w-full cursor-pointer flex-col border-none px-3 py-2 text-left transition-colors hover:bg-[var(--bg-surface)]"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {t.name}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ToolbarButton
          icon={<Search size={16} />}
          label="Command palette (Ctrl+K)"
          onClick={onToggleCommandPalette}
        />
        <ToolbarButton
          icon={<RotateCcw size={16} />}
          label="Reset"
          onClick={handleReset}
        />
        <ToolbarButton
          icon={<Share2 size={16} />}
          label="Share"
          onClick={handleShare}
        />
        <ToolbarButton
          icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          label={theme === "dark" ? "Light mode" : "Dark mode"}
          onClick={toggleTheme}
        />
      </div>
    </header>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-md border-none px-2.5 py-1.5 text-xs transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      style={{
        backgroundColor: active ? "var(--bg-elevated)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
      }}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
