import { useEffect } from "react";
import { useStore } from "../state/store";
import { useTool, type Tool } from "./useTool";

// Returnerer true hvis fokuset er i et tekstfelt — da skal vi ikke kapre
// vanlige bokstavtaster eller Ctrl+Z (nettleseren håndterer textarea-undo).
function isEditingText() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
  if (el.isContentEditable) return true;
  return false;
}

const TOOL_KEYS: Record<string, Tool> = {
  v: "select",
  s: "slide",
  t: "text",
  p: "arrow",
};

export function useKeyboard() {
  const { undo, redo } = useStore();
  const {
    setTool,
    toggleShortcuts,
    closeShortcuts,
    showShortcuts,
    showSettings,
    closeSettings,
  } = useTool();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Escape lukker shortcuts-modal eller resetter til select-modus,
      // også når fokus er i tekstfelt (det er fortsatt nyttig).
      if (e.key === "Escape") {
        if (showShortcuts) {
          closeShortcuts();
          return;
        }
        if (showSettings) {
          closeSettings();
          return;
        }
        setTool("select");
        return;
      }

      if (isEditingText()) return;

      const cmd = e.ctrlKey || e.metaKey;

      if (cmd && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      // Verktøy-bokstaver: ingen modifiers tillatt (unngår kollisjon med Ctrl+S etc.)
      if (!cmd && !e.altKey) {
        const t = TOOL_KEYS[e.key.toLowerCase()];
        if (t) {
          e.preventDefault();
          setTool(t);
          return;
        }
        if (e.key === "?") {
          e.preventDefault();
          toggleShortcuts();
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    undo,
    redo,
    setTool,
    toggleShortcuts,
    closeShortcuts,
    showShortcuts,
    showSettings,
    closeSettings,
  ]);
}
