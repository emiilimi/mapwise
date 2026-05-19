import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, NodeResizer, Position, type Node } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TextNode as TextNodeData } from "../types";
import { DEFAULT_TEXT_SIZE } from "../types";
import { markdownComponents } from "../lib/markdownComponents";

export type TextFlowNode = Node<{ content: string }, "text">;

function TextNodeImpl({ data, selected }: NodeProps<TextFlowNode>) {
  return (
    <div
      className={
        "relative h-full w-full overflow-hidden rounded-lg border bg-yellow-50 shadow-sm transition-shadow " +
        (selected
          ? "border-blue-500 shadow-md"
          : "border-yellow-200 hover:shadow")
      }
    >
      <NodeResizer
        minWidth={100}
        minHeight={60}
        isVisible={selected}
        lineClassName="!border-blue-400"
        handleClassName="!bg-blue-500 !border-white"
      />
      <Handle type="target" position={Position.Top} className="!bg-neutral-400" />
      <div className="markdown-body h-full w-full overflow-hidden p-3 text-sm leading-snug">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {data.content}
        </ReactMarkdown>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-neutral-400" />
    </div>
  );
}

export const TextNode = memo(TextNodeImpl);

export function toFlowNode(n: TextNodeData) {
  const size = n.size ?? DEFAULT_TEXT_SIZE;
  return {
    id: n.id,
    type: "text" as const,
    position: n.position,
    data: { content: n.content },
    width: size.width,
    height: size.height,
  };
}
