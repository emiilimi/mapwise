import { useTool } from "../hooks/useTool";
import { useMap, useStore } from "../state/store";

// TODO fremtidige innstillinger: pilstil (Bezier/rett/ortogonal), skriftstørrelse,
// slide-bakgrunnsfarge, animasjonstype i presenter-modus, snap-til-grid.

export function SettingsPanel() {
  const { showSettings, closeSettings } = useTool();
  const settings = useMap().settings;
  const { dispatch } = useStore();

  if (!showSettings) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/20"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <div className="h-full w-[320px] overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold">Kartinnstillinger</h2>
          <button
            onClick={closeSettings}
            title="Lukk (Escape)"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-4 text-sm">
          <Field
            label="Zoom-terskel"
            hint="Under denne zoom-verdien viser slides kun thumbnail."
          >
            <input
              type="number"
              min={0.1}
              max={2}
              step={0.1}
              value={settings.zoomThreshold}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_SETTINGS",
                  patch: { zoomThreshold: Number(e.target.value) },
                })
              }
              className="w-24 rounded border border-neutral-300 px-2 py-1"
            />
          </Field>

          <Field
            label="Klikk-oppførsel"
            hint='"Utvid" gjør boksen større. "Fullskjerm" fyller hele skjermen.'
          >
            <select
              value={settings.clickBehavior}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_SETTINGS",
                  patch: {
                    clickBehavior: e.target.value as "expand" | "fullscreen",
                  },
                })
              }
              className="w-full rounded border border-neutral-300 px-2 py-1"
            >
              <option value="expand">Utvid</option>
              <option value="fullscreen">Fullskjerm</option>
            </select>
          </Field>

          <Field label="Canvas-bakgrunn" hint="Bakgrunnsfargen bak hele kartet.">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.canvasBackground}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    patch: { canvasBackground: e.target.value },
                  })
                }
                className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
              />
              <code className="text-xs text-neutral-500">
                {settings.canvasBackground}
              </code>
            </div>
          </Field>

          <div className="border-t border-neutral-100 pt-4">
            <div className="mb-1 font-medium text-neutral-800">
              Oppsummering
            </div>
            <p className="mb-3 text-xs text-neutral-500">
              Slide-bokser kan ha en <code>summary:</code>-linje i frontmatter.
              På kartet vises den alltid hvis innholdet ikke får plass.
              I presentasjonsmodus er den skjult som default.
            </p>
            <label className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showSummaryInPresent}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    patch: { showSummaryInPresent: e.target.checked },
                  })
                }
              />
              <span>Vis oppsummering i presentasjonsmodus</span>
            </label>
            <div
              className={
                "ml-6 flex items-center gap-3 text-xs " +
                (settings.showSummaryInPresent
                  ? "text-neutral-700"
                  : "text-neutral-400")
              }
            >
              <span>Plassering:</span>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="summary-pos"
                  checked={settings.summaryPosition === "top"}
                  disabled={!settings.showSummaryInPresent}
                  onChange={() =>
                    dispatch({
                      type: "UPDATE_SETTINGS",
                      patch: { summaryPosition: "top" },
                    })
                  }
                />
                Øverst
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="summary-pos"
                  checked={settings.summaryPosition === "bottom"}
                  disabled={!settings.showSummaryInPresent}
                  onChange={() =>
                    dispatch({
                      type: "UPDATE_SETTINGS",
                      patch: { summaryPosition: "bottom" },
                    })
                  }
                />
                Nederst
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 font-medium text-neutral-800">{label}</div>
      {hint && <p className="mb-2 text-xs text-neutral-500">{hint}</p>}
      {children}
    </label>
  );
}
