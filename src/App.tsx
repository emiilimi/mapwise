import { useEffect, useRef } from "react";
import { importFromHtml } from "./lib/importHtml";
import { Canvas } from "./canvas/Canvas";
import { StoreProvider, useStore } from "./state/store";
import { ToolProvider } from "./hooks/useTool";
import { useKeyboard } from "./hooks/useKeyboard";
import { Toolbar } from "./toolbar/Toolbar";
import { ShortcutsHelp } from "./modals/ShortcutsHelp";
import { NodeEditor } from "./modals/NodeEditor";
import { SettingsPanel } from "./modals/SettingsPanel";
import { ExportDialog } from "./modals/ExportDialog";
import { PresentMode } from "./present/PresentMode";
import { useTool } from "./hooks/useTool";
import { newId } from "./lib/id";
import { DEFAULT_SLIDE_SIZE } from "./types";

// Midlertidig seed for å se noe på kartet før import/eksport finnes.
function useSeed() {
  const { state, dispatch } = useStore();
  // StrictMode kjører effekten to ganger i dev; closure-kapret state er
  // tom begge ganger. Uten denne guarden dispatches seedet to ganger og vi
  // får overlappende duplikater av alle noder.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    if (state.present.nodes.length > 0) {
      seeded.current = true;
      return;
    }
    seeded.current = true;
    const a = newId();
    const b = newId();
    dispatch({
      type: "ADD_NODE",
      node: {
        type: "slide",
        id: a,
        position: { x: 0, y: 0 },
        size: DEFAULT_SLIDE_SIZE,
        markdown: `---\nslide: 1\nthumbnail: Start\n---\n\n# Velkommen\n\nDette er **MapWise**.`,
      },
    });
    dispatch({
      type: "ADD_NODE",
      node: {
        type: "slide",
        id: b,
        position: { x: 420, y: 0 },
        size: DEFAULT_SLIDE_SIZE,
        markdown: `---\nslide: 2\nthumbnail: Hovedpoeng\n---\n\n# Punkt to\n\n- Linje\n- Linje\n`,
      },
    });
    dispatch({
      type: "ADD_NODE",
      node: {
        type: "text",
        id: newId(),
        position: { x: 200, y: 280 },
        content: "Tekstnotat på kartet",
      },
    });
    dispatch({ type: "ADD_EDGE", edge: { id: newId(), from: a, to: b } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function Shell() {
  useSeed();
  useKeyboard();
  const { openSettings, openPresent, openExport } = useTool();
  const { dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // tillat samme fil igjen senere
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = await importFromHtml(text);
      dispatch({ type: "REPLACE_ALL", file: parsed });
    } catch (err) {
      alert("Klarte ikke å åpne filen: " + (err as Error).message);
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      <Toolbar
        onOpenSettings={openSettings}
        onPresent={() => openPresent("explore")}
        onExport={openExport}
        onOpenFile={() => fileInputRef.current?.click()}
      />
      <div className="flex-1">
        <Canvas />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,text/html"
        onChange={onFileSelected}
        className="hidden"
      />
      <ShortcutsHelp />
      <NodeEditor />
      <SettingsPanel />
      <ExportDialog />
      <PresentMode />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToolProvider>
        <Shell />
      </ToolProvider>
    </StoreProvider>
  );
}
