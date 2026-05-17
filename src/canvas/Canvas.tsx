import { useCallback, useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMap, useStore } from "../state/store";
import { useTool } from "../hooks/useTool";
import { toFlowNode as toSlideFlow } from "./SlideNode";
import { toFlowNode as toTextFlow } from "./TextNode";
import { nodeTypes } from "./nodeTypes";
import { newId } from "../lib/id";
import { DEFAULT_SLIDE_MARKDOWN, DEFAULT_SLIDE_SIZE } from "../types";

function CanvasInner() {
  const map = useMap();
  const { dispatch } = useStore();
  const { tool, setTool } = useTool();
  const rf = useReactFlow();

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

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removed: string[] = [];
      for (const c of changes) {
        if (c.type === "position" && !c.dragging && c.position) {
          dispatch({ type: "MOVE_NODE", id: c.id, position: c.position });
        } else if (c.type === "remove") {
          removed.push(c.id);
        }
      }
      if (removed.length > 0) dispatch({ type: "DELETE_NODES", ids: removed });
    },
    [dispatch],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = changes
        .filter((c): c is EdgeChange & { type: "remove" } => c.type === "remove")
        .map((c) => c.id);
      if (removed.length > 0) dispatch({ type: "DELETE_EDGES", ids: removed });
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

  // Klikk på tom canvas: plasser ny node hvis vi er i S/T-modus.
  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool !== "slide" && tool !== "text") return;
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      if (tool === "slide") {
        dispatch({
          type: "ADD_NODE",
          node: {
            type: "slide",
            id: newId(),
            position: pos,
            size: DEFAULT_SLIDE_SIZE,
            markdown: DEFAULT_SLIDE_MARKDOWN,
          },
        });
      } else {
        dispatch({
          type: "ADD_NODE",
          node: {
            type: "text",
            id: newId(),
            position: pos,
            content: "Nytt notat",
          },
        });
      }
      setTool("select");
    },
    [tool, rf, dispatch, setTool],
  );

  const placementMode = tool === "slide" || tool === "text";

  return (
    <div
      className="h-full w-full"
      style={{
        background: map.settings.canvasBackground,
        cursor: placementMode ? "crosshair" : undefined,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        deleteKeyCode={["Delete", "Backspace"]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
