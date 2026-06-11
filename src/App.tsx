import { useEffect, useRef, useState } from "react";
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
import { SlidePanel, SidebarToggle } from "./sidebar/SlidePanel";
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
  const { openSettings, openPresent, openExport, showSidebar } = useTool();
  const { dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // null = ingen import pågår. total=0 → «forbereder» (zip lastes/parses).
  const [importing, setImporting] = useState<{ done: number; total: number } | null>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // tillat samme fil igjen senere
    if (!file) return;
    try {
      const isPptx =
        /\.pptx$/i.test(file.name) ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      let parsed;
      if (isPptx) {
        setImporting({ done: 0, total: 0 });
        // Dynamisk import: jszip + parseren holdes ute av hovedbundelen og
        // lastes først når noen faktisk åpner en .pptx.
        const { importFromPptx } = await import("./lib/importPptx");
        parsed = await importFromPptx(await file.arrayBuffer(), (done, total) =>
          setImporting({ done, total }),
        );
      } else {
        parsed = await importFromHtml(await file.text());
      }
      dispatch({ type: "REPLACE_ALL", file: parsed });
    } catch (err) {
      alert("Klarte ikke å åpne filen: " + (err as Error).message);
    } finally {
      setImporting(null);
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
      <div className="flex min-h-0 flex-1">
        {showSidebar && <SlidePanel />}
        <div className="relative min-w-0 flex-1">
          <SidebarToggle />
          <Canvas />
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,text/html,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        onChange={onFileSelected}
        className="hidden"
      />
      <ShortcutsHelp />
      <NodeEditor />
      <SettingsPanel />
      <ExportDialog />
      <PresentMode />
      {importing && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-3 rounded-lg bg-white px-8 py-6 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-neutral-700">
              {importing.total === 0
                ? "Leser presentasjonen …"
                : `Importerer lysbilde ${importing.done}/${importing.total} …`}
            </p>
          </div>
        </div>
      )}
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
