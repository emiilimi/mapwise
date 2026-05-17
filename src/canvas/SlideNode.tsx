import { memo, useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position, useStore as useRfStore, type Node } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseFrontmatter } from "../lib/frontmatter";
import { useMap } from "../state/store";
import type { SlideNode as SlideNodeData } from "../types";

export type SlideFlowNode = Node<{ markdown: string }, "slide">;

// Henter zoom-nivået direkte fra ReactFlow-store med selector — gir bare
// re-render når zoom faktisk endrer seg (ikke ved pan).
// TODO ytelse: med mange noder kan dette fortsatt være tungt. Alternativ:
// flytt zoom-state opp og send terskel-side via Context, eller fall tilbake
// til alltid-thumbnail.
const zoomSelector = (s: { transform: [number, number, number] }) =>
  s.transform[2];

function SlideNodeImpl({ data, selected }: NodeProps<SlideFlowNode>) {
  const { slide, thumbnail, body } = useMemo(
    () => parseFrontmatter(data.markdown),
    [data.markdown],
  );

  const zoom = useRfStore(zoomSelector);
  const zoomThreshold = useMap().settings.zoomThreshold;
  const showThumbnail = zoom < zoomThreshold;

  return (
    <div
      className={
        "relative h-full w-full overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow " +
        (selected
          ? "border-blue-500 shadow-md"
          : "border-neutral-300 hover:shadow")
      }
    >
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

      {/* Full markdown */}
      <div
        className="markdown-body absolute inset-0 p-3 pt-6 text-sm leading-snug transition-opacity duration-200"
        style={{ opacity: showThumbnail ? 0 : 1 }}
        aria-hidden={showThumbnail}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
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
