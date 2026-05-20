import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, NodeResizer, Position, type Node } from "@xyflow/react";
import type { ImageNode as ImageNodeData } from "../types";

export type ImageFlowNode = Node<
  { src: string; alt?: string; slide?: number; thumbnail?: string },
  "image"
>;

function ImageNodeImpl({ data, selected }: NodeProps<ImageFlowNode>) {
  return (
    <div
      className={
        "relative h-full w-full overflow-hidden rounded-lg border bg-neutral-100 shadow-sm transition-shadow " +
        (selected
          ? "border-blue-500 shadow-md"
          : "border-neutral-300 hover:shadow")
      }
    >
      <NodeResizer
        minWidth={80}
        minHeight={60}
        isVisible={selected}
        keepAspectRatio
        lineClassName="!border-blue-400"
        handleClassName="!bg-blue-500 !border-white"
      />
      <Handle type="target" position={Position.Top} className="!bg-neutral-400" />

      {(data.slide != null || data.thumbnail) && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide">
          {data.slide != null && (
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-white">
              {data.slide}
            </span>
          )}
          {data.thumbnail && (
            <span className="rounded bg-neutral-200/80 px-1.5 py-0.5 text-neutral-700">
              {data.thumbnail}
            </span>
          )}
        </div>
      )}

      {data.src ? (
        <img
          src={data.src}
          alt={data.alt ?? ""}
          className="h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
          Ingen bilde
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-neutral-400" />
    </div>
  );
}

export const ImageNode = memo(ImageNodeImpl);

export function toFlowNode(n: ImageNodeData): ImageFlowNode {
  return {
    id: n.id,
    type: "image",
    position: n.position,
    data: { src: n.src, alt: n.alt, slide: n.slide, thumbnail: n.thumbnail },
    width: n.size.width,
    height: n.size.height,
  };
}
