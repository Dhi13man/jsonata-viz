import { useCallback } from "react";
import { Share2, Moon, Sun, RotateCcw } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useEditorStore } from "@/stores/editor-store";
import { encodeShareUrl } from "@/lib/utils/lz-url";

export function Toolbar() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const expression = useEditorStore((s) => s.expression);

  const handleShare = useCallback(() => {
    const url = encodeShareUrl({ expression });
    if (!url) return;
    navigator.clipboard.writeText(url).catch(() => {
      // Fallback: prompt with the URL for manual copy
      window.prompt("Copy this URL:", url);
    });
  }, [expression]);

  const handleReset = useCallback(() => {
    useEditorStore.getState().setExpression("Account.Order.Product.Price");
  }, []);

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b px-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Logo + title */}
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

      {/* Actions */}
      <div className="flex items-center gap-1">
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
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-transparent px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      title={label}
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
