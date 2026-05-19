import { useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseFrontmatter } from "../lib/frontmatter";
import { markdownComponents } from "../lib/markdownComponents";
import { useFitText } from "../lib/useFitText";
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

  if (!node || node.type !== "slide") return null;

  const { slide, thumbnail, summary, fixedForm: slideFixed, body } = parsed;
  const fullscreen = map.settings.clickBehavior === "fullscreen";
  const showSummary = map.settings.showSummaryInPresent && !!summary;
  const summaryAtTop = map.settings.summaryPosition === "top";
  const effectiveFixed = slideFixed ?? map.settings.fixedForm;
  const aspect = effectiveFixed
    ? parseAspectRatio(map.settings.aspectRatio) ?? 16 / 9
    : null;
  const fitRef = useRef<HTMLDivElement>(null);
  useFitText(fitRef, body, effectiveFixed, 12, 96);

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
                className="markdown-body h-full w-full overflow-hidden p-8 leading-snug"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{body}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="markdown-body flex-1 overflow-auto p-8 text-base leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{body}</ReactMarkdown>
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
