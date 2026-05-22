import { memo, useMemo, useRef } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, NodeResizer, Position, type Node } from "@xyflow/react";
import type { ImageNode as ImageNodeData } from "../types";
import { useShiftResize } from "../lib/useShiftResize";
import { useMap, useStore } from "../state/store";

export type ImageFlowNode = Node<
  {
    src: string;
    alt?: string;
    slide?: number;
    thumbnail?: string;
    sourceName?: string;
    sourceUrl?: string;
  },
  "image"
>;

function ImageNodeImpl({ id, data, selected, width, height }: NodeProps<ImageFlowNode>) {
  const map = useMap();
  const { dispatch } = useStore();
  const nodeData = useMemo(() => map.nodes.find((n) => n.id === id), [map.nodes, id]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const aspectRatio = width && height ? width / height : null;
  useShiftResize(wrapperRef, {
    id,
    position: nodeData?.position ?? { x: 0, y: 0 },
    size: { width: width ?? 320, height: height ?? 200 },
    minWidth: 80,
    minHeight: 60,
    aspectRatio,
    dispatch,
    enabled: !!nodeData,
  });
  return (
    <div
      ref={wrapperRef}
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
      {(data.sourceName || data.sourceUrl) && (
        <div className="absolute bottom-0 left-0 right-0 z-10 truncate bg-black/50 px-2 py-0.5 text-[10px] text-white">
          {data.sourceUrl ? (
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {data.sourceName || data.sourceUrl}
            </a>
          ) : (
            <span>{data.sourceName}</span>
          )}
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
    data: {
      src: n.src,
      alt: n.alt,
      slide: n.slide,
      thumbnail: n.thumbnail,
      sourceName: n.sourceName,
      sourceUrl: n.sourceUrl,
    },
    width: n.size.width,
    height: n.size.height,
  };
}
