import { useCallback, useEffect, useMemo, useState } from "react";
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
import { toFlowNode as toImageFlow } from "./ImageNode";
import { nodeTypes } from "./nodeTypes";
import { ImageDialog } from "../modals/ImageDialog";
import { ContextMenu } from "./ContextMenu";
import { newId } from "../lib/id";
import { DEFAULT_SLIDE_MARKDOWN, DEFAULT_SLIDE_SIZE, DEFAULT_TEXT_SIZE, parseAspectRatio, type ImageNode } from "../types";

function CanvasInner() {
  const map = useMap();
  const { dispatch } = useStore();
  const { tool, setTool, openEditor } = useTool();
  const rf = useReactFlow();

  // Pilmodus: id-en til kilde-noden mens vi venter på mål-klikket.
  const [arrowSource, setArrowSource] = useState<string | null>(null);
  // Høyreklikk-meny på node.
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(
    null,
  );
  // Bildemodus: ventende posisjon for ny bildenode (dialog åpen), og id for redigering.
  const [pendingImagePos, setPendingImagePos] = useState<{ x: number; y: number } | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  // Reset av pil-state når brukeren bytter verktøy.
  useEffect(() => {
    if (tool !== "arrow" && arrowSource !== null) setArrowSource(null);
  }, [tool, arrowSource]);

  // Etter import (REPLACE_ALL): gi ReactFlow én render-syklus til å prosessere
  // nye noder, deretter fitte viewport til dem.
  const { importedAt } = map;
  useEffect(() => {
    if (!importedAt) return;
    const timer = setTimeout(() => rf.fitView({ duration: 400 }), 60);
    return () => clearTimeout(timer);
  }, [importedAt, rf]);

  const nodes = useMemo<Node[]>(
    () =>
      map.nodes.map((n) => {
        const flow =
          n.type === "slide"
            ? toSlideFlow(n)
            : n.type === "image"
              ? toImageFlow(n)
              : toTextFlow(n);
        if (n.id === arrowSource) {
          return { ...flow, className: "ring-2 ring-blue-500 ring-offset-2" };
        }
        return flow;
      }),
    [map.nodes, arrowSource],
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
        } else if (c.type === "dimensions" && c.dimensions && c.resizing) {
          // Bare dispatch under aktiv resize-drag — RF fyrer også off dimensions
          // ved layout-måling, som ikke skal lagres.
          dispatch({
            type: "RESIZE_NODE",
            id: c.id,
            size: {
              width: Math.round(c.dimensions.width),
              height: Math.round(c.dimensions.height),
            },
          });
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

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === "arrow" && arrowSource) {
        // Klikk utenfor noder mens vi har en kilde valgt: avbryt.
        setArrowSource(null);
        return;
      }
      if (tool !== "slide" && tool !== "text" && tool !== "image") return;
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      if (tool === "image") {
        setPendingImagePos(pos);
        return;
      }
      if (tool === "slide") {
        const aspect = map.settings.fixedForm
          ? parseAspectRatio(map.settings.aspectRatio)
          : null;
        const size = aspect
          ? {
              width: DEFAULT_SLIDE_SIZE.width,
              height: Math.round(DEFAULT_SLIDE_SIZE.width / aspect),
            }
          : DEFAULT_SLIDE_SIZE;
        dispatch({
          type: "ADD_NODE",
          node: {
            type: "slide",
            id: newId(),
            position: pos,
            size,
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
            size: DEFAULT_TEXT_SIZE,
            content: "Nytt notat",
          },
        });
      }
      setTool("select");
    },
    [tool, arrowSource, rf, dispatch, setTool],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, n: Node) => {
      if (tool !== "arrow") return;
      if (!arrowSource) {
        setArrowSource(n.id);
      } else if (arrowSource !== n.id) {
        dispatch({
          type: "ADD_EDGE",
          edge: { id: newId(), from: arrowSource, to: n.id },
        });
        // Bli i pilmodus så brukeren kan kjede flere piler. Esc/V for å slutte.
        setArrowSource(null);
      }
    },
    [tool, arrowSource, dispatch],
  );

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, n: Node) => {
      e.preventDefault();
      setMenu({ x: e.clientX, y: e.clientY, id: n.id });
    },
    [],
  );

  function duplicate(id: string) {
    const orig = map.nodes.find((n) => n.id === id);
    if (!orig) return;
    const offset = { x: orig.position.x + 32, y: orig.position.y + 32 };
    if (orig.type === "slide") {
      dispatch({
        type: "ADD_NODE",
        node: { ...orig, id: newId(), position: offset },
      });
    } else {
      dispatch({
        type: "ADD_NODE",
        node: { ...orig, id: newId(), position: offset },
      });
    }
  }

  const placementMode = tool === "slide" || tool === "text" || tool === "image";
  const cursor = placementMode || tool === "arrow" ? "crosshair" : undefined;

  return (
    <div
      className="relative h-full w-full"
      style={{ background: map.settings.canvasBackground, cursor }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={(_, n) => {
          if (n.type === "image") setEditingImageId(n.id);
          else openEditor(n.id);
        }}
        onNodeContextMenu={onNodeContextMenu}
        deleteKeyCode={["Delete", "Backspace"]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {tool === "arrow" && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded bg-blue-600 px-3 py-1 text-xs text-white shadow">
          {arrowSource
            ? "Klikk mål-node (Esc for å avbryte)"
            : "Klikk kilde-node"}
        </div>
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: "Dupliser", onClick: () => duplicate(menu.id) },
            {
              label: "Slett",
              destructive: true,
              onClick: () => dispatch({ type: "DELETE_NODES", ids: [menu.id] }),
            },
          ]}
        />
      )}

      {pendingImagePos && (
        <ImageDialog
          onConfirm={({ src, alt }) => {
            dispatch({
              type: "ADD_NODE",
              node: {
                type: "image",
                id: newId(),
                position: pendingImagePos,
                size: { width: 320, height: 200 },
                src,
                alt: alt || undefined,
              } satisfies ImageNode,
            });
            setPendingImagePos(null);
            setTool("select");
          }}
          onClose={() => {
            setPendingImagePos(null);
            setTool("select");
          }}
        />
      )}

      {editingImageId && (() => {
        const imgNode = map.nodes.find(
          (n) => n.id === editingImageId && n.type === "image",
        );
        if (!imgNode || imgNode.type !== "image") return null;
        return (
          <ImageDialog
            defaultSrc={imgNode.src}
            defaultAlt={imgNode.alt}
            onConfirm={({ src, alt }) => {
              dispatch({
                type: "UPDATE_NODE",
                id: editingImageId,
                patch: { src, alt: alt || undefined },
              });
              setEditingImageId(null);
            }}
            onClose={() => setEditingImageId(null)}
          />
        );
      })()}
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
