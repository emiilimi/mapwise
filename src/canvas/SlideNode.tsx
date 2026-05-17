import { memo, useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position, type Node } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseFrontmatter } from "../lib/frontmatter";
import type { SlideNode as SlideNodeData } from "../types";

export type SlideFlowNode = Node<{ markdown: string }, "slide">;

function SlideNodeImpl({ data, selected }: NodeProps<SlideFlowNode>) {
  // Parser hver render — useMemo gjør at vi bare jobber når strengen faktisk endrer seg.
  const { slide, thumbnail, body } = useMemo(
    () => parseFrontmatter(data.markdown),
    [data.markdown],
  );

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
        <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide">
          {slide !== null && (
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-white">
              {slide}
            </span>
          )}
          {thumbnail && (
            <span className="rounded bg-neutral-200/80 px-1.5 py-0.5 text-neutral-700">
              {thumbnail}
            </span>
          )}
        </div>
      )}

      <div className="markdown-body p-3 pt-6 text-sm leading-snug">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
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
