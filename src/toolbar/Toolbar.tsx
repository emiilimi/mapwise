import { useStore } from "../state/store";
import { useTool } from "../hooks/useTool";
import { ToolButton } from "./ToolButton";

interface Props {
  onOpenSettings: () => void;
  onPresent: () => void;
  onExport: () => void;
  onOpenFile: () => void;
}

// Ikonene er tekst/Unicode for å unngå ikon-bibliotek-dep i Steg 5.
// Kan byttes til Lucide eller lignende senere uten endring av API.
export function Toolbar({
  onOpenSettings,
  onPresent,
  onExport,
  onOpenFile,
}: Props) {
  const { tool, setTool, toggleShortcuts } = useTool();
  const { undo, redo, canUndo, canRedo } = useStore();

  return (
    <div className="flex items-center gap-1 border-b border-neutral-200 bg-white px-3 py-2">
      <div className="mr-4 flex flex-col items-start">
        <span className="text-base font-semibold leading-none">MapShow</span>
        <span className="text-[10px] text-neutral-400">redigerer</span>
      </div>

      <ToolButton
        icon="▣"
        label="Velg"
        shortcut="V"
        active={tool === "select"}
        onClick={() => setTool("select")}
      />
      <ToolButton
        icon="🗎"
        label="Slide"
        shortcut="S"
        active={tool === "slide"}
        onClick={() => setTool("slide")}
      />
      <ToolButton
        icon="T"
        label="Tekst"
        shortcut="T"
        active={tool === "text"}
        onClick={() => setTool("text")}
      />
      <ToolButton
        icon="↘"
        label="Pil"
        shortcut="P"
        active={tool === "arrow"}
        onClick={() => setTool("arrow")}
      />

      <div className="mx-2 h-10 w-px bg-neutral-200" />

      <ToolButton icon="⤺" label="Angre" shortcut="⌃Z" disabled={!canUndo} onClick={undo} />
      <ToolButton icon="⤻" label="Gjør om" shortcut="⌃⇧Z" disabled={!canRedo} onClick={redo} />

      <div className="mx-2 h-10 w-px bg-neutral-200" />

      <ToolButton icon="🔗" label="Lenke" shortcut="L" disabled title="Kommer snart" />
      <ToolButton icon="🖼" label="Bilde" shortcut="B" disabled title="Kommer snart" />

      <div className="ml-auto flex items-center gap-1">
        <ToolButton icon="▶" label="Presenter" onClick={onPresent} title="Åpne presentasjonsmodus" />
        <ToolButton icon="⤓" label="Eksport" onClick={onExport} title="Eksporter til HTML" />
        <ToolButton icon="📂" label="Åpne" onClick={onOpenFile} title="Importer fra HTML" />
        <ToolButton icon="⚙" label="Innst." onClick={onOpenSettings} />
        <ToolButton icon="?" label="Hjelp" shortcut="?" onClick={toggleShortcuts} />
      </div>
    </div>
  );
}
