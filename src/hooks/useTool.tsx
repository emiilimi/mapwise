import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tool = "select" | "slide" | "text" | "arrow";

interface ToolContextValue {
  tool: Tool;
  setTool: (t: Tool) => void;
  showShortcuts: boolean;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;
}

const ToolContext = createContext<ToolContextValue | null>(null);

export function ToolProvider({ children }: { children: ReactNode }) {
  const [tool, setTool] = useState<Tool>("select");
  const [showShortcuts, setShowShortcuts] = useState(false);

  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);
  const closeShortcuts = useCallback(() => setShowShortcuts(false), []);

  const value = useMemo<ToolContextValue>(
    () => ({ tool, setTool, showShortcuts, toggleShortcuts, closeShortcuts }),
    [tool, showShortcuts, toggleShortcuts, closeShortcuts],
  );

  return <ToolContext value={value}>{children}</ToolContext>;
}

export function useTool() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useTool må brukes inni ToolProvider");
  return ctx;
}
