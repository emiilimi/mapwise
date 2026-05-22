import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { parseFrontmatter } from "../lib/frontmatter";
import { markdownComponents } from "../lib/markdownComponents";
import { useFitText } from "../lib/useFitText";
import { extractPositionedImages, stripPositionSyntax } from "../lib/positionedImages";
import { useMap } from "../state/store";
import { useTool } from "../hooks/useTool";
import { parseAspectRatio } from "../types";
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
  const isImageSlide = current?.node.type === "image";
  const showSummary =
    map.settings.showSummaryInPresent && !!current?.summary;
  const summaryAtTop = map.settings.summaryPosition === "top";
  // Per-slide override via frontmatter.fixedForm (only applies to slide nodes).
  const slideFixed = useMemo(
    () => (current?.node.type === "slide" ? parseFrontmatter(current.node.markdown).fixedForm : null),
    [current],
  );
  const effectiveFixed = slideFixed ?? map.settings.fixedForm;
  const aspect = effectiveFixed
    ? parseAspectRatio(map.settings.aspectRatio) ?? 16 / 9
    : null;
  const fitRef = useRef<HTMLDivElement>(null);
  useFitText(fitRef, current?.body ?? "", !isImageSlide && effectiveFixed, 14, 120);
  // Posisjonerte bilder kun i fixedForm. I fri form strippes syntakset.
  const processedSegments = useMemo(() => {
    if (!current || isImageSlide) return { segments: [""], images: [] as ReturnType<typeof extractPositionedImages>["images"] };
    const raw = splitSteps(current.body);
    if (effectiveFixed) {
      // Trekk ut posisjonerte bilder fra hele body, og strip dem fra hver segment.
      const r = extractPositionedImages(current.body);
      // For at posisjonerte bilder ikke skal dukke opp i segmenter heller:
      const segments = raw.map((s) => extractPositionedImages(s).cleaned);
      return { segments, images: r.images };
    }
    return { segments: raw.map(stripPositionSyntax), images: [] };
  }, [current, isImageSlide, effectiveFixed]);
  const segments = processedSegments.segments;
  const positionedImages = processedSegments.images;
  const nominalSize = current?.node.type === "slide" ? current.node.size : { width: 320, height: 200 };
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
        className="animate-fade absolute inset-0 flex flex-col p-12"
      >
        {showSummary && summaryAtTop && (
          <div className="mx-auto mb-6 max-w-4xl rounded bg-yellow-50 px-4 py-2 text-sm italic text-neutral-700 ring-1 ring-yellow-200">
            {current?.summary}
          </div>
        )}
        {isImageSlide && current.node.type === "image" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <img
              src={current.node.src}
              alt={current.node.alt ?? ""}
              className="max-h-[90%] max-w-full object-contain rounded shadow-lg"
            />
            {(current.node.sourceName || current.node.sourceUrl) && (
              <div className="text-sm text-neutral-500">
                Kilde:{" "}
                {current.node.sourceUrl ? (
                  <a
                    href={current.node.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {current.node.sourceName || current.node.sourceUrl}
                  </a>
                ) : (
                  <span>{current.node.sourceName}</span>
                )}
              </div>
            )}
          </div>
        ) : effectiveFixed ? (
          // Fast form: aspect-låst container som fyller skjermen, auto-fit
          // basert på fullt body-innhold (alle steg synlige for fitter, men
          // opacity skjuler de uavslørte).
          <div className="flex flex-1 items-center justify-center">
            <div
              className="w-full overflow-hidden rounded border border-neutral-200 bg-white shadow-lg"
              style={{
                aspectRatio: String(aspect),
                maxHeight: "100%",
                maxWidth: "100%",
              }}
            >
              <div
                ref={fitRef}
                className="markdown-body relative h-full w-full overflow-hidden p-10 leading-snug"
              >
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>{seg}</ReactMarkdown>
                  </div>
                ))}
                {positionedImages.map((img, i) => (
                  <img
                    key={`img-${i}`}
                    src={img.src}
                    alt={img.alt}
                    style={{
                      position: "absolute",
                      left: `${(img.x / nominalSize.width) * 100}%`,
                      top: `${(img.y / nominalSize.height) * 100}%`,
                      width: img.w ? `${(img.w / nominalSize.width) * 100}%` : undefined,
                      height: img.h ? `${(img.h / nominalSize.height) * 100}%` : undefined,
                      pointerEvents: "none",
                    }}
                    draggable={false}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>{seg}</ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        )}
        {showSummary && !summaryAtTop && (
          <div className="mx-auto mt-6 max-w-4xl rounded bg-yellow-50 px-4 py-2 text-sm italic text-neutral-700 ring-1 ring-yellow-200">
            {current?.summary}
          </div>
        )}
      </div>

      {/* HUD nede til høyre */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs text-neutral-700 shadow backdrop-blur">
        <span className="flex items-center gap-1.5">
          {current?.slide != null && (
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-white text-[10px] font-medium">
              {current.slide}
            </span>
          )}
          <span className="text-neutral-400">{idx + 1}/{slides.length}</span>
          {current?.thumbnail && (
            <span className="text-neutral-400">· {current.thumbnail}</span>
          )}
        </span>
        {!isImageSlide && totalSteps > 1 && (
          <>
            <span className="text-neutral-300">|</span>
            <span>steg {step + 1}/{totalSteps}</span>
          </>
        )}
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
