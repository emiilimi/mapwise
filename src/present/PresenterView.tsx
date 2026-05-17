import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMap } from "../state/store";
import { useTool } from "../hooks/useTool";
import { getOrderedSlides } from "./slideOrder";
import { splitSteps } from "./stepSplitter";

// TODO: hopp-til-slide-N, speaker notes, miniature timeline,
// shared-element-transition mot kart-modus (Framer Motion).

export function PresenterView() {
  const map = useMap();
  const { closePresent, setPresentMode } = useTool();

  const slides = useMemo(() => getOrderedSlides(map), [map]);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);

  const current = slides[idx] ?? null;
  const segments = useMemo(
    () => (current ? splitSteps(current.body) : [""]),
    [current],
  );
  const totalSteps = segments.length;

  const advance = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else if (idx < slides.length - 1) {
      setIdx((i) => i + 1);
      setStep(0);
    }
  }, [step, totalSteps, idx, slides.length]);

  const back = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else if (idx > 0) {
      setIdx((i) => i - 1);
      // Hopp til siste steg av forrige slide.
      const prev = slides[idx - 1];
      if (prev) setStep(splitSteps(prev.body).length - 1);
    }
  }, [step, idx, slides]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  if (slides.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-500">
        <p>Ingen slides med <code>slide:</code>-felt funnet.</p>
        <button
          onClick={() => setPresentMode("explore")}
          className="rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
        >
          Tilbake til utforsk
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-50">
      {/* En slide vises av gangen, sentrert. Bytter via key= så fade-in kjøres. */}
      <div
        key={idx}
        className="animate-fade absolute inset-0 flex items-center justify-center p-12"
      >
        <div className="markdown-body max-w-4xl text-lg leading-relaxed">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="transition-opacity duration-300"
              style={{
                opacity: i <= step ? 1 : 0,
                pointerEvents: i <= step ? "auto" : "none",
              }}
              aria-hidden={i > step}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{seg}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>

      {/* HUD nede til høyre */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs text-neutral-700 shadow backdrop-blur">
        <span>
          {idx + 1} / {slides.length}
          {current?.thumbnail && (
            <span className="ml-2 text-neutral-400">· {current.thumbnail}</span>
          )}
        </span>
        <span className="text-neutral-300">|</span>
        <span>
          steg {step + 1}/{totalSteps}
        </span>
        <button
          onClick={closePresent}
          className="ml-2 rounded px-2 py-0.5 text-neutral-700 hover:bg-neutral-100"
          title="Tilbake til kart (Esc)"
        >
          Tilbake
        </button>
      </div>

      {/* Diskret venstre/høyre-hint */}
      <div className="pointer-events-none absolute bottom-4 left-4 text-xs text-neutral-400">
        ← forrige &nbsp;·&nbsp; →/mellomrom neste
      </div>
    </div>
  );
}
