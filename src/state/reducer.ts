import {
  DEFAULT_SETTINGS,
  FILE_VERSION,
  type AnyNode,
  type Arrow,
  type MapSettings,
  type MapShowFile,
} from "../types";

export interface MapState {
  version: string;
  settings: MapSettings;
  nodes: AnyNode[];
  edges: Arrow[];
}

export const initialMapState: MapState = {
  version: FILE_VERSION,
  settings: DEFAULT_SETTINGS,
  nodes: [],
  edges: [],
};

export type MapAction =
  | { type: "ADD_NODE"; node: AnyNode }
  | { type: "UPDATE_NODE"; id: string; patch: Partial<AnyNode> }
  | { type: "MOVE_NODE"; id: string; position: { x: number; y: number } }
  | { type: "DELETE_NODES"; ids: string[] }
  | { type: "ADD_EDGE"; edge: Arrow }
  | { type: "DELETE_EDGES"; ids: string[] }
  | { type: "UPDATE_SETTINGS"; patch: Partial<MapSettings> }
  | { type: "REPLACE_ALL"; file: MapShowFile };

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

    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "REPLACE_ALL":
      return {
        version: action.file.version,
        settings: action.file.settings,
        nodes: action.file.nodes,
        edges: action.file.edges,
      };
  }
}
