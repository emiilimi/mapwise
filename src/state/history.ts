import {
  initialMapState,
  mapReducer,
  type MapAction,
  type MapState,
} from "./reducer";

// Maks antall snapshots i undo-stacken. Hindrer ubegrenset minnevekst.
const MAX_HISTORY = 100;

// Når en MOVE_NODE skjer raskt etter forrige MOVE_NODE for samme node, slår vi
// dem sammen til ett undo-steg. Uten dette ville hver piksel under et drag bli
// en egen undo-frame (~60 per sekund). 500 ms gir nok luft for et helt drag,
// men kort nok til at to bevisste flytt blir separate steg.
const MOVE_MERGE_WINDOW_MS = 500;

export interface HistoryState {
  past: MapState[];
  present: MapState;
  future: MapState[];
  // Sporing for MOVE/RESIZE-merge. Null når siste handling ikke var en drag.
  lastDrag: { id: string; kind: "move" | "resize"; at: number } | null;
}

export const initialHistoryState: HistoryState = {
  past: [],
  present: initialMapState,
  future: [],
  lastDrag: null,
};

export type HistoryAction =
  | { type: "DO"; action: MapAction }
  | { type: "UNDO" }
  | { type: "REDO" };

function pushPast(past: MapState[], snapshot: MapState): MapState[] {
  const next = [...past, snapshot];
  // Klipp fra fronten når vi går over MAX_HISTORY.
  if (next.length > MAX_HISTORY) next.splice(0, next.length - MAX_HISTORY);
  return next;
}

export function historyReducer(
  state: HistoryState,
  ha: HistoryAction,
): HistoryState {
  switch (ha.type) {
    case "DO": {
      const next = mapReducer(state.present, ha.action);
      if (next === state.present) return state;

      // MOVE/RESIZE-merge: behold snapshotet fra før draget startet.
      const dragKind: "move" | "resize" | null =
        ha.action.type === "MOVE_NODE"
          ? "move"
          : ha.action.type === "RESIZE_NODE"
            ? "resize"
            : null;

      if (dragKind !== null) {
        const id =
          ha.action.type === "MOVE_NODE" || ha.action.type === "RESIZE_NODE"
            ? ha.action.id
            : "";
        const now = Date.now();
        const sameDrag =
          state.lastDrag !== null &&
          state.lastDrag.id === id &&
          state.lastDrag.kind === dragKind &&
          now - state.lastDrag.at < MOVE_MERGE_WINDOW_MS;

        return {
          past: sameDrag ? state.past : pushPast(state.past, state.present),
          present: next,
          future: [],
          lastDrag: { id, kind: dragKind, at: now },
        };
      }

      return {
        past: pushPast(state.past, state.present),
        present: next,
        future: [],
        lastDrag: null,
      };
    }

    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastDrag: null,
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        past: pushPast(state.past, state.present),
        present: next,
        future: rest,
        lastDrag: null,
      };
    }
  }
}
