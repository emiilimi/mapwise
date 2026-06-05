import { useMemo, useRef } from "react";
import { parseFrontmatter } from "../lib/frontmatter";
import { SafeMarkdown } from "../lib/SafeMarkdown";
import { useFitText } from "../lib/useFitText";
import { extractPositionedImages, stripPositionSyntax } from "../lib/positionedImages";
import { splitSteps } from "./stepSplitter";
import { useMap } from "../state/store";
import { parseAspectRatio } from "../types";

interface Props {
  slideId: string;
  onClose: () => void;
}

export function ExpandedSlide({ slideId, onClose }: Props) {
  const map = useMap();
  const node = map.nodes.find((n) => n.id === slideId);
  const parsed = useMemo(() => {
    if (!node || node.type !== "slide")
      return {
        slide: null,
        thumbnail: null,
        summary: null,
        textSize: null,
        fixedForm: null,
        body: "",
      };
    const fm = parseFrontmatter(node.markdown);
    return { ...fm, body: splitSteps(fm.body).join("\n\n") };
  }, [node]);

  // Hooks must run unconditionally before any early returns.
  const { slide, thumbnail, summary, fixedForm: slideFixed, body: parsedBody } = parsed;
  const fullscreen = map.settings.clickBehavior === "fullscreen";
  const showSummary = map.settings.showSummaryInPresent && !!summary;
  const summaryAtTop = map.settings.summaryPosition === "top";
  const effectiveFixed = slideFixed ?? map.settings.fixedForm;
  const aspect = effectiveFixed
    ? parseAspectRatio(map.settings.aspectRatio) ?? 16 / 9
    : null;
  // Posisjonerte bilder bare i fixedForm — ellers strippes syntakset.
  const { body, positionedImages } = useMemo(() => {
    if (effectiveFixed) {
      const r = extractPositionedImages(parsedBody);
      return { body: r.cleaned, positionedImages: r.images };
    }
    return { body: stripPositionSyntax(parsedBody), positionedImages: [] };
  }, [parsedBody, effectiveFixed]);
  const nominalSize = node && node.type === "slide" ? node.size : { width: 320, height: 200 };
  const fitRef = useRef<HTMLDivElement>(null);
  useFitText(fitRef, body, effectiveFixed, 12, 96);

  if (!node) return null;

  // Image node: full-screen image viewer with slide badge.
  if (node.type === "image") {
    return (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className={
            "flex flex-col rounded-lg bg-white shadow-2xl " +
            (fullscreen ? "h-[92vh] w-[92vw]" : "h-[70vh] w-[60vw] max-w-3xl")
          }
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              {node.slide != null && (
                <span className="rounded bg-blue-600 px-2 py-0.5 text-white">
                  Slide {node.slide}
                </span>
              )}
              {node.thumbnail && <span>{node.thumbnail}</span>}
            </div>
            <button onClick={onClose} className="rounded px-2 py-1 hover:bg-neutral-100" title="Lukk (Esc)">✕</button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4 overflow-hidden">
            <img
              src={node.src}
              alt={node.alt ?? ""}
              className="max-h-full max-w-full object-contain rounded"
            />
          </div>
          {(node.sourceName || node.sourceUrl) && (
            <div className="border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500">
              Kilde:{" "}
              {node.sourceUrl ? (
                <a
                  href={node.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {node.sourceName || node.sourceUrl}
                </a>
              ) : (
                <span>{node.sourceName}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (node.type !== "slide") return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          "flex flex-col rounded-lg bg-white shadow-2xl " +
          (fullscreen ? "h-[92vh] w-[92vw]" : "h-[70vh] w-[60vw] max-w-3xl")
        }
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            {slide !== null && (
              <span className="rounded bg-blue-600 px-2 py-0.5 text-white">
                Slide {slide}
              </span>
            )}
            {thumbnail && <span>{thumbnail}</span>}
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 hover:bg-neutral-100"
            title="Lukk (Esc)"
          >
            ✕
          </button>
        </div>
        {showSummary && summaryAtTop && (
          <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-2 text-sm italic text-neutral-700">
            {summary}
          </div>
        )}
        {effectiveFixed ? (
          // Fast form: bevarer slide-aspect-ratio og auto-fitter teksten.
          <div className="flex flex-1 items-center justify-center p-6">
            <div
              className="mx-auto w-full overflow-hidden rounded border border-neutral-200 bg-white"
              style={{
                aspectRatio: String(aspect),
                maxHeight: "100%",
                maxWidth: "100%",
              }}
            >
              <div
                ref={fitRef}
                className="markdown-body relative h-full w-full overflow-hidden p-8 leading-snug"
              >
                <SafeMarkdown>{body}</SafeMarkdown>
                {positionedImages.map((img, i) => (
                  <img
                    key={i}
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
          <div className="markdown-body flex-1 overflow-auto p-8 text-base leading-relaxed">
            <SafeMarkdown>{body}</SafeMarkdown>
          </div>
        )}
        {showSummary && !summaryAtTop && (
          <div className="border-t border-yellow-200 bg-yellow-50 px-6 py-2 text-sm italic text-neutral-700">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}
