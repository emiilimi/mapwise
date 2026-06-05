import { memo, useMemo, useRef } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, NodeResizer, Position, type Node } from "@xyflow/react";
import type { TextNode as TextNodeData } from "../types";
import { DEFAULT_TEXT_SIZE } from "../types";
import { SafeMarkdown } from "../lib/SafeMarkdown";
import { useShiftResize } from "../lib/useShiftResize";
import { useMap, useStore } from "../state/store";

export type TextFlowNode = Node<{ content: string }, "text">;

function TextNodeImpl({ id, data, selected, width, height }: NodeProps<TextFlowNode>) {
  const map = useMap();
  const { dispatch } = useStore();
  const nodeData = useMemo(() => map.nodes.find((n) => n.id === id), [map.nodes, id]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useShiftResize(wrapperRef, {
    id,
    position: nodeData?.position ?? { x: 0, y: 0 },
    size: { width: width ?? 220, height: height ?? 120 },
    minWidth: 100,
    minHeight: 60,
    aspectRatio: null,
    dispatch,
    enabled: !!nodeData,
  });
  return (
    <div
      ref={wrapperRef}
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
        <SafeMarkdown>{data.content}</SafeMarkdown>
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
