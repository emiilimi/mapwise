import { useCallback, useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type Connection,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMap, useStore } from "../state/store";
import { toFlowNode as toSlideFlow } from "./SlideNode";
import { toFlowNode as toTextFlow } from "./TextNode";
import { nodeTypes } from "./nodeTypes";
import { newId } from "../lib/id";

// Vi lar React Flow rapportere position-endringer via onNodesChange, og
// mapper bare "position"-changes med dragging=false (= drag avsluttet) til
// MOVE_NODE. Drag-merge-logikken i history.ts håndterer mellom-frames hvis
// vi senere sender flere events under draget.
export function Canvas() {
  const map = useMap();
  const { dispatch } = useStore();

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
        type: "default", // bezier
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    [map.edges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const c of changes) {
        if (c.type === "position" && !c.dragging && c.position) {
          dispatch({ type: "MOVE_NODE", id: c.id, position: c.position });
        }
      }
    },
    [dispatch],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = changes
        .filter((c): c is EdgeChange & { type: "remove" } => c.type === "remove")
        .map((c) => c.id);
      if (removed.length > 0) {
        dispatch({ type: "DELETE_EDGES", ids: removed });
      }
    },
    [dispatch],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      dispatch({
        type: "ADD_EDGE",
        edge: { id: newId(), from: c.source, to: c.target },
      });
    },
    [dispatch],
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
