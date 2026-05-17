import { useTool } from "../hooks/useTool";

const ROWS: Array<[string, string]> = [
  ["V", "Velg / flytt"],
  ["S", "Ny slide-boks (klikk på canvas for å plassere)"],
  ["T", "Nytt tekstnotat"],
  ["P", "Pil (klikk kilde, klikk mål) — Steg 7"],
  ["Ctrl + Z", "Angre"],
  ["Ctrl + Shift + Z", "Gjør om"],
  ["Delete / Backspace", "Slett valgt(e)"],
  ["Escape", "Tilbake til velg-modus / lukk panel"],
  ["?", "Vis/skjul denne hjelpen"],
];

export function ShortcutsHelp() {
  const { showShortcuts, closeShortcuts } = useTool();
  if (!showShortcuts) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={closeShortcuts}
    >
      <div
        className="w-[440px] rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hurtigtaster</h2>
          <button
            onClick={closeShortcuts}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
            title="Lukk (Escape)"
          >
            ✕
          </button>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {ROWS.map(([key, desc]) => (
              <tr key={key} className="border-t border-neutral-100">
                <td className="py-1.5 pr-4 font-mono text-xs text-neutral-700">
                  {key}
                </td>
                <td className="py-1.5 text-neutral-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
