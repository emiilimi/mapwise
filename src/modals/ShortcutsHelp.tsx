import { useTool } from "../hooks/useTool";

const SHORTCUTS: Array<[string, string]> = [
  ["V", "Velg / flytt"],
  ["S", "Ny slide-boks (klikk på canvas for å plassere)"],
  ["T", "Nytt tekstnotat"],
  ["B", "Ny bildenode"],
  ["P", "Pilmodus (klikk kilde, klikk mål)"],
  ["‹ / ›", "Vis/skjul slide-panelet (knapp øverst til venstre)"],
  ["F", "Fullskjerm (i presentasjonsmodus)"],
  ["Shift + dra", "Endre størrelse fra nærmeste hjørne"],
  ["Ctrl + Z", "Angre"],
  ["Ctrl + Shift + Z", "Gjør om"],
  ["Delete / Backspace", "Slett valgt(e)"],
  ["Ctrl + V", "Lim inn bilde fra utklippstavle"],
  ["Escape", "Tilbake til velg-modus / lukk panel"],
  ["?", "Vis/skjul denne hjelpen"],
];

const EDITOR_SHORTCUTS: Array<[string, string]> = [
  ["Ctrl + K", "Sett inn lenke — markér tekst først, eller skriv inn URL"],
  ["🖼 Bilde-knapp", "Sett inn bilde (URL eller lokal fil)"],
  ["Ctrl + V", "Lim inn bilde fra utklippstavle direkte i editoren"],
];

const MARKDOWN: Array<[string, string]> = [
  ["# Overskrift", "H1 — bruk ## for H2, ### for H3"],
  ["**fet** / *kursiv*", "Fet eller kursiv tekst"],
  ["- punkt", "Punktliste (også * eller 1. for nummerert)"],
  ["[tekst](url)", "Lenke"],
  ["![alt](url)", "Bilde inline"],
  ["![alt](url){x=100,y=50,w=200}", "Bilde absolutt-posisjonert (fixedForm)"],
  ["---step---", "Skille mellom steg i presenter-modus"],
  ["| kol | kol |", "Tabell (GFM-syntaks)"],
  ["> sitat", "Sitatblokk"],
  ["`kode`", "Inline kode — ``` for kodeblokk"],
  ["<iframe ...>", "HTML-innbygg (video, kart, grafer osv.)"],
];

const FRONTMATTER = `---
slide: 1
thumbnail: Kort tittel
summary: Sammendrag
textSize: 9
fixedForm: true
---`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function KeyTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([key, desc]) => (
          <tr key={key} className="border-t border-neutral-100">
            <td className="py-1.5 pr-4 font-mono text-xs text-neutral-700 whitespace-nowrap">
              {key}
            </td>
            <td className="py-1.5 text-neutral-600">{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ShortcutsHelp() {
  const { showShortcuts, closeShortcuts } = useTool();
  if (!showShortcuts) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={closeShortcuts}
    >
      <div
        className="w-[520px] max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hjelp</h2>
          <button
            onClick={closeShortcuts}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
            title="Lukk (Escape)"
          >
            ✕
          </button>
        </div>

        <Section title="Hurtigtaster — kart">
          <KeyTable rows={SHORTCUTS} />
        </Section>

        <Section title="Hurtigtaster — editor">
          <KeyTable rows={EDITOR_SHORTCUTS} />
        </Section>

        <Section title="Markdown-syntaks">
          <KeyTable rows={MARKDOWN} />
        </Section>

        <Section title="Frontmatter (øverst i en slide-boks)">
          <pre className="mt-1 rounded bg-neutral-50 p-3 text-xs text-neutral-700 font-mono leading-relaxed border border-neutral-200">
            {FRONTMATTER}
          </pre>
          <p className="mt-1 text-xs text-neutral-400">
            <code>slide:</code> bestemmer presentasjonsrekkefølge (støtter desimaler) ·{" "}
            <code>textSize:</code> skriftstørrelse i px på kartet (kun fri form — i fast
            form auto-tilpasses teksten) · <code>fixedForm:</code> overstyrer
            kart-innstillingen per slide
          </p>
        </Section>
      </div>
    </div>
  );
}
