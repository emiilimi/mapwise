import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position, type Node } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SlideNode as SlideNodeData } from "../types";

// Render-modellen vår er ikke React Flow sin "data"-konvensjon — vi mapper
// SlideNode.markdown direkte over som data.markdown i Canvas.tsx.
export type SlideFlowNode = Node<{ markdown: string }, "slide">;

function SlideNodeImpl({ data, selected }: NodeProps<SlideFlowNode>) {
  return (
    <div
      className={
        "h-full w-full overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow " +
        (selected
          ? "border-blue-500 shadow-md"
          : "border-neutral-300 hover:shadow")
      }
    >
      <Handle type="target" position={Position.Top} className="!bg-neutral-400" />
      <div className="markdown-body p-3 text-sm leading-snug">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.markdown}</ReactMarkdown>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-neutral-400" />
    </div>
  );
}

export const SlideNode = memo(SlideNodeImpl);

// Hjelper for mapping fra datamodell til React Flow-node.
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
