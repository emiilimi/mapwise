import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position, type Node } from "@xyflow/react";
import type { TextNode as TextNodeData } from "../types";

export type TextFlowNode = Node<{ content: string }, "text">;

function TextNodeImpl({ data, selected }: NodeProps<TextFlowNode>) {
  return (
    <div
      className={
        "min-w-[80px] max-w-[280px] whitespace-pre-wrap rounded px-2 py-1 text-sm transition-colors " +
        (selected
          ? "bg-blue-50 text-blue-900 ring-1 ring-blue-300"
          : "bg-neutral-100/60 text-neutral-700 hover:bg-neutral-100")
      }
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      {data.content}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export const TextNode = memo(TextNodeImpl);

export function toFlowNode(n: TextNodeData) {
  return {
    id: n.id,
    type: "text" as const,
    position: n.position,
    data: { content: n.content },
    ...(n.size ? { width: n.size.width, height: n.size.height } : {}),
  };
}
