import {
  DEFAULT_SETTINGS,
  FILE_VERSION,
  parseAspectRatio,
  type AnyNode,
  type Arrow,
  type MapSettings,
  type MapWiseFile,
} from "../types";
import { setSlideNumber } from "../lib/frontmatter";

export interface MapState {
  version: string;
  settings: MapSettings;
  nodes: AnyNode[];
  edges: Arrow[];
  // Oppdateres ved REPLACE_ALL slik at Canvas kan triggre fitView.
  // Ikke del av MapWiseFile — eksporteres ikke.
  importedAt: number;
}

export const initialMapState: MapState = {
  version: FILE_VERSION,
  settings: DEFAULT_SETTINGS,
  nodes: [],
  edges: [],
  importedAt: 0,
};

export type MapAction =
  | { type: "ADD_NODE"; node: AnyNode }
  | { type: "UPDATE_NODE"; id: string; patch: Partial<AnyNode> }
  | { type: "MOVE_NODE"; id: string; position: { x: number; y: number } }
  | { type: "RESIZE_NODE"; id: string; size: { width: number; height: number } }
  | {
      type: "TRANSFORM_NODE";
      id: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }
  | { type: "DELETE_NODES"; ids: string[] }
  | { type: "ADD_EDGE"; edge: Arrow }
  | { type: "DELETE_EDGES"; ids: string[] }
  | { type: "UPDATE_SETTINGS"; patch: Partial<MapSettings> }
  | { type: "REORDER_SLIDES"; order: string[] }
  | { type: "REPLACE_ALL"; file: MapWiseFile };

// Pure reducer. Ingen side-effects, ingen identitets-hacks — undo/redo i history.ts
// stoler på at samme action gir samme state, og at strukturen er enkel å snapshotte.
export function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case "ADD_NODE":
      return { ...state, nodes: [...state.nodes, action.node] };

    case "UPDATE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id
            ? // Patchen er typet som Partial<AnyNode>; type-feltet kan ikke endres
              // i praksis (kallere lar det være), så cast er trygt nok her.
              ({ ...n, ...action.patch } as AnyNode)
            : n,
        ),
      };

    case "MOVE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, position: action.position } : n,
        ),
      };

    case "RESIZE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          if (n.id !== action.id) return n;
          if (n.type !== "slide" && n.type !== "image" && n.type !== "text") return n;
          return { ...n, size: action.size };
        }),
      };

    case "TRANSFORM_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          if (n.id !== action.id) return n;
          if (n.type !== "slide" && n.type !== "image" && n.type !== "text") return n;
          return { ...n, position: action.position, size: action.size };
        }),
      };

    case "DELETE_NODES": {
      const ids = new Set(action.ids);
      return {
        ...state,
        nodes: state.nodes.filter((n) => !ids.has(n.id)),
        // Slipp edges som peker til/fra slettede noder.
        edges: state.edges.filter((e) => !ids.has(e.from) && !ids.has(e.to)),
      };
    }

    case "ADD_EDGE":
      // Hindre duplikater og selv-løkker.
      if (action.edge.from === action.edge.to) return state;
      if (
        state.edges.some(
          (e) => e.from === action.edge.from && e.to === action.edge.to,
        )
      ) {
        return state;
      }
      return { ...state, edges: [...state.edges, action.edge] };

    case "DELETE_EDGES": {
      const ids = new Set(action.ids);
      return { ...state, edges: state.edges.filter((e) => !ids.has(e.id)) };
    }

    case "UPDATE_SETTINGS": {
      const newSettings = { ...state.settings, ...action.patch };
      // Når fixedForm slås på eller aspect-ratio endres, normaliser
      // høyden på alle slide-noder så de matcher det nye sideforholdet.
      // Gjøres her (ikke i en useEffect) så det er én atomær undo-frame.
      const aspectChanged =
        newSettings.fixedForm !== state.settings.fixedForm ||
        newSettings.aspectRatio !== state.settings.aspectRatio;
      let nodes = state.nodes;
      if (newSettings.fixedForm && aspectChanged) {
        const aspect = parseAspectRatio(newSettings.aspectRatio);
        if (aspect !== null) {
          nodes = state.nodes.map((n) => {
            if (n.type !== "slide") return n;
            const targetH = Math.max(60, Math.round(n.size.width / aspect));
            if (n.size.height === targetH) return n;
            return { ...n, size: { width: n.size.width, height: targetH } };
          });
        }
      }
      return { ...state, settings: newSettings, nodes };
    }

    case "REORDER_SLIDES": {
      // Tildel slide-nummer 1..N etter ny rekkefølge. Ider som ikke er med i
      // `order` beholder sin markdown/`slide` urørt.
      const orderMap = new Map(action.order.map((id, i) => [id, i + 1]));
      if (orderMap.size === 0) return state;
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          const num = orderMap.get(n.id);
          if (num === undefined) return n;
          if (n.type === "slide")
            return { ...n, markdown: setSlideNumber(n.markdown, num) };
          if (n.type === "image") return { ...n, slide: num };
          return n;
        }),
      };
    }

    case "REPLACE_ALL":
      return {
        version: action.file.version,
        settings: { ...DEFAULT_SETTINGS, ...action.file.settings },
        nodes: action.file.nodes,
        edges: action.file.edges,
        importedAt: Date.now(),
      };
  }
}
