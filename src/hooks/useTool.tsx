import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tool = "select" | "slide" | "text" | "arrow";
export type PresentMode = "off" | "explore" | "presenter";

interface ToolContextValue {
  tool: Tool;
  setTool: (t: Tool) => void;
  showShortcuts: boolean;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;
  // Node-editor: id-en til noden som redigeres, null = ingen.
  editingId: string | null;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  showSettings: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  presentMode: PresentMode;
  openPresent: (mode?: PresentMode) => void;
  setPresentMode: (m: PresentMode) => void;
  closePresent: () => void;
  showExport: boolean;
  openExport: () => void;
  closeExport: () => void;
}

const ToolContext = createContext<ToolContextValue | null>(null);

export function ToolProvider({ children }: { children: ReactNode }) {
  const [tool, setTool] = useState<Tool>("select");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [presentMode, setPresentMode] = useState<PresentMode>("off");
  const [showExport, setShowExport] = useState(false);

  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);
  const closeShortcuts = useCallback(() => setShowShortcuts(false), []);
  const openEditor = useCallback((id: string) => setEditingId(id), []);
  const closeEditor = useCallback(() => setEditingId(null), []);
  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const openPresent = useCallback(
    (mode: PresentMode = "explore") => setPresentMode(mode),
    [],
  );
  const closePresent = useCallback(() => setPresentMode("off"), []);
  const openExport = useCallback(() => setShowExport(true), []);
  const closeExport = useCallback(() => setShowExport(false), []);

  const value = useMemo<ToolContextValue>(
    () => ({
      tool,
      setTool,
      showShortcuts,
      toggleShortcuts,
      closeShortcuts,
      editingId,
      openEditor,
      closeEditor,
      showSettings,
      openSettings,
      closeSettings,
      presentMode,
      openPresent,
      setPresentMode,
      closePresent,
      showExport,
      openExport,
      closeExport,
    }),
    [
      tool,
      showShortcuts,
      toggleShortcuts,
      closeShortcuts,
      editingId,
      openEditor,
      closeEditor,
      showSettings,
      openSettings,
      closeSettings,
      presentMode,
      openPresent,
      closePresent,
      showExport,
      openExport,
      closeExport,
    ],
  );

  return <ToolContext value={value}>{children}</ToolContext>;
}

export function useTool() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useTool må brukes inni ToolProvider");
  return ctx;
}
