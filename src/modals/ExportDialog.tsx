import { useState } from "react";
import { useTool } from "../hooks/useTool";
import { useMap } from "../state/store";
import { downloadFiles, exportSelfContained } from "../lib/exportHtml";

export function ExportDialog() {
  const { showExport, closeExport } = useTool();
  const state = useMap();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showExport) return null;

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const result = await exportSelfContained(state);
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
      <div className="w-[420px] rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Eksporter kart</h2>
          <button
            onClick={closeExport}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-neutral-600">
          Laster ned én selvinneholdt <code>.html</code>-fil. Filen kan åpnes i
          nettleseren uten internett, deles med andre, og lastes tilbake inn i
          editoren via «Åpne».
        </p>

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
            {busy ? "Lager fil …" : "Last ned"}
          </button>
        </div>
      </div>
    </div>
  );
}
