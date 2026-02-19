/**
 * Command palette — Phase 2.6.
 * Triggered by Cmd/Ctrl+K. Search and execute actions.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Keyboard } from "lucide-react";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(search.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : commands;

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      // Focus input after render
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      onClose();
      cmd.action();
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) {
            executeCommand(filtered[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, executeCommand, onClose],
  );

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: "var(--bg-overlay)",
          zIndex: "var(--z-command-palette)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2 rounded-xl shadow-lg"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          zIndex: "var(--z-command-palette)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: "var(--border-default)" }}
        >
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={
              filtered[selectedIndex]
                ? `cmd-${filtered[selectedIndex].id}`
                : undefined
            }
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-tertiary)",
              border: "1px solid var(--border-default)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          className="max-h-80 overflow-y-auto py-2"
        >
          {filtered.length === 0 && (
            <div
              className="px-4 py-6 text-center text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              No commands found
            </div>
          )}
          {filtered.map((cmd, index) => (
            <div
              key={cmd.id}
              id={`cmd-${cmd.id}`}
              role="option"
              aria-selected={index === selectedIndex}
              className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm transition-colors"
              style={{
                backgroundColor:
                  index === selectedIndex
                    ? "var(--bg-elevated)"
                    : "transparent",
                color: "var(--text-primary)",
              }}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div>
                <div className="text-xs font-medium">{cmd.label}</div>
                {cmd.description && (
                  <div
                    className="text-[11px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {cmd.description}
                  </div>
                )}
              </div>
              {cmd.shortcut && (
                <kbd
                  className="rounded px-1.5 py-0.5 text-[10px]"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {cmd.shortcut}
                </kbd>
              )}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-3 border-t px-4 py-2 text-[10px]"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-tertiary)",
          }}
        >
          <span className="flex items-center gap-1">
            <Keyboard size={10} /> Navigate
          </span>
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </>
  );
}
