import { useState } from "react";
import { useTool } from "../hooks/useTool";
import { useMap } from "../state/store";
import {
  downloadFiles,
  exportCompact,
  exportSelfContained,
} from "../lib/exportHtml";

type Mode = "self" | "compact" | "cdn";

export function ExportDialog() {
  const { showExport, closeExport } = useTool();
  const state = useMap();
  const [mode, setMode] = useState<Mode>("self");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showExport) return null;

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "self"
          ? await exportSelfContained(state)
          : await exportCompact(state);
      downloadFiles(result.files);
      closeExport();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeExport();
      }}
    >
      <div className="w-[480px] rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Eksporter kart</h2>
          <button
            onClick={closeExport}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Radio
            checked={mode === "self"}
            onSelect={() => setMode("self")}
            label="Selvinneholdt"
            hint="Én HTML-fil. Viewer-koden inlines i filen. Fungerer offline."
          />
          <Radio
            checked={mode === "compact"}
            onSelect={() => setMode("compact")}
            label="Kompakt"
            hint="HTML-fil + mapshow-viewer.js + mapshow-viewer.css side om side. Mindre HTML-fil, men tre filer å håndtere."
          />
          <Radio
            checked={false}
            onSelect={() => undefined}
            label="CDN (kommer)"
            hint="Last viewer fra en CDN-URL. Krever publisert viewer-bundle — TODO."
            disabled
          />
        </div>

        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={closeExport}
            className="rounded px-3 py-1 text-sm hover:bg-neutral-100"
          >
            Avbryt
          </button>
          <button
            onClick={onExport}
            disabled={busy}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {busy ? "Lager filer …" : "Last ned"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RadioProps {
  checked: boolean;
  onSelect: () => void;
  label: string;
  hint: string;
  disabled?: boolean;
}

function Radio({ checked, onSelect, label, hint, disabled }: RadioProps) {
  return (
    <label
      className={
        "flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors " +
        (disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
          : checked
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-200 hover:border-neutral-300")
      }
    >
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
        className="mt-0.5"
      />
      <span>
        <div className="font-medium">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-500">{hint}</div>
      </span>
    </label>
  );
}
