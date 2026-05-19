import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import {
  Handle,
  NodeResizer,
  Position,
  useStore as useRfStore,
  type Node,
} from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DEFAULT_SLIDE_TEXT_SIZE, parseFrontmatter } from "../lib/frontmatter";
import { useFitText } from "../lib/useFitText";
import { markdownComponents } from "../lib/markdownComponents";
import { splitSteps } from "../present/stepSplitter";
import { useMap, useStore } from "../state/store";
import { parseAspectRatio } from "../types";
import { usePresentContext } from "./PresentContext";
import type { SlideNode as SlideNodeData } from "../types";

export type SlideFlowNode = Node<{ markdown: string }, "slide">;

// Hent zoom-nivå fra ReactFlow-store med selector — bare re-render når
// zoom faktisk endrer seg (ikke ved pan).
// TODO ytelse: med mange noder kan dette fortsatt være tungt. Alternativ:
// flytt zoom-state opp og send terskel-side via Context.
const zoomSelector = (s: { transform: [number, number, number] }) =>
  s.transform[2];

function SlideNodeImpl({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<SlideFlowNode>) {
  const { slide, thumbnail, summary, textSize, fixedForm: slideFixed, body: rawBody } =
    useMemo(() => parseFrontmatter(data.markdown), [data.markdown]);
  const body = useMemo(() => splitSteps(rawBody).join("\n\n"), [rawBody]);
  const baseFontSize = textSize ?? DEFAULT_SLIDE_TEXT_SIZE;

  const zoom = useRfStore(zoomSelector);
  const settings = useMap().settings;
  // Per-slide-frontmatter overstyrer kart-innstillingen.
  const fixedForm = slideFixed ?? settings.fixedForm;
  const { inPresent } = usePresentContext();
  const showThumbnail = zoom < settings.zoomThreshold;
  const aspect = settings.fixedForm
    ? parseAspectRatio(settings.aspectRatio)
    : null;

  // Overflow-detect på markdown-body. ResizeObserver fanger både endringer
  // i innholdets høyde og når brukeren resizer noden. I fast form er
  // overflow uinteressant siden auto-fit garanterer at alt får plass.
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    if (fixedForm) {
      setOverflowing(false);
      return;
    }
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [body, fixedForm]);

  // Auto-fit i fast form. Hooket setter inline font-size; vi clearer den
  // ved disable så CSS-default fra textSize tar over.
  useFitText(contentRef, body, fixedForm);

  // Contain-modus: bare i fri form. Vokser boksens høyde til all tekst
  // får plass. Krymper ikke (brukeren kan dra hjørnet ned manuelt).
  const containEnabled = !fixedForm && settings.containMode;
  const { dispatch } = useStore();
  const lastContainHeight = useRef(-1);
  useEffect(() => {
    if (!containEnabled) return;
    const inner = contentRef.current;
    if (!inner) return;
    function measure() {
      const inner = contentRef.current;
      if (!inner) return;
      const delta = inner.scrollHeight - inner.clientHeight;
      if (delta <= 1) return;
      const target = (height ?? 200) + delta;
      if (Math.abs(target - lastContainHeight.current) < 2) return;
      lastContainHeight.current = target;
      dispatch({
        type: "RESIZE_NODE",
        id,
        size: { width: width ?? 320, height: Math.round(target) },
      });
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [containEnabled, body, dispatch, id, width, height]);

  // På kartet (editor + utforsk-modus uvalgt slide) vises summary som en
  // italic linje rett over body når innholdet ikke får plass. Settings-
  // togglene og posisjon-valget gjelder kun ekspandert visning og
  // presenter-modus — ikke selve kart-rutene.
  const showSummary = !!summary && !showThumbnail && overflowing;
  // inPresent fortsatt importert for fremtidig bruk, men slå-av-funksjonen
  // for kart-rutene er ikke ønsket av brukeren.
  void inPresent;

  return (
    <div
      className={
        "relative h-full w-full overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow " +
        (selected
          ? "border-blue-500 shadow-md"
          : "border-neutral-300 hover:shadow")
      }
    >
      <NodeResizer
        minWidth={120}
        minHeight={80}
        isVisible={selected}
        keepAspectRatio={aspect !== null}
        lineClassName="!border-blue-400"
        handleClassName="!bg-blue-500 !border-white"
      />
      <Handle type="target" position={Position.Top} className="!bg-neutral-400" />

      {(slide !== null || thumbnail) && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide">
          {slide !== null && (
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-white">
              {slide}
            </span>
          )}
          {thumbnail && !showThumbnail && (
            <span className="rounded bg-neutral-200/80 px-1.5 py-0.5 text-neutral-700">
              {thumbnail}
            </span>
          )}
        </div>
      )}

      {/* Full markdown — summary settes inn som en italic linje rett over body.
          Base font-size styres av `textSize:` i frontmatter (eller DEFAULT). */}
      <div
        ref={contentRef}
        className="markdown-body absolute inset-0 overflow-hidden p-3 pt-6 leading-snug transition-opacity duration-200"
        style={{
          opacity: showThumbnail ? 0 : 1,
          // I fast form styrer useFitText fontSize via el.style direkte —
          // unngå at React kontinuerlig setter den tilbake til textSize.
          fontSize: fixedForm ? undefined : `${baseFontSize}px`,
        }}
        aria-hidden={showThumbnail}
      >
        {showSummary && summary && (
          <p
            className="mb-1 italic leading-tight text-neutral-600"
            title={summary}
          >
            {summary}
          </p>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{body}</ReactMarkdown>
      </div>

      {/* Thumbnail-overlay */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center transition-opacity duration-200"
        style={{ opacity: showThumbnail ? 1 : 0 }}
        aria-hidden={!showThumbnail}
      >
        <span className="text-2xl font-semibold text-neutral-700">
          {thumbnail ?? (slide !== null ? `Slide ${slide}` : "Slide")}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-neutral-400" />
    </div>
  );
}

export const SlideNode = memo(SlideNodeImpl);

export function toFlowNode(n: SlideNodeData): SlideFlowNode {
  return {
    id: n.id,
    type: "slide",
    position: n.position,
    data: { markdown: n.markdown },
    width: n.size.width,
    height: n.size.height,
  };
}
