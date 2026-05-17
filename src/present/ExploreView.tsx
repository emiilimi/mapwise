import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
// Må importeres her i tillegg til Canvas, ellers mangler den i viewer-
// bundelen (som ikke når Canvas).
import "@xyflow/react/dist/style.css";
import { useMap } from "../state/store";
import { toFlowNode as toSlideFlow } from "../canvas/SlideNode";
import { toFlowNode as toTextFlow } from "../canvas/TextNode";
import { nodeTypes } from "../canvas/nodeTypes";
import { PresentContext } from "../canvas/PresentContext";

interface Props {
  onSlideClick: (id: string) => void;
}

// Read-only canvas i utforsk-modus. Drag/connect/select er av; pan og zoom på.
function ExploreInner({ onSlideClick }: Props) {
  const map = useMap();

  const nodes = useMemo<Node[]>(
    () =>
      map.nodes.map((n) =>
        n.type === "slide" ? toSlideFlow(n) : toTextFlow(n),
      ),
    [map.nodes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      map.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        type: "default",
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    [map.edges],
  );

  return (
    <div
      className="h-full w-full"
      style={{ background: map.settings.canvasBackground }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={(_, n) => {
          if (n.type === "slide") onSlideClick(n.id);
        }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function ExploreView(props: Props) {
  return (
    <PresentContext value={{ inPresent: true }}>
      <ReactFlowProvider>
        <ExploreInner {...props} />
      </ReactFlowProvider>
    </PresentContext>
  );
}
