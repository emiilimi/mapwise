import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  historyReducer,
  initialHistoryState,
  type HistoryState,
} from "./history";
import type { MapAction, MapState } from "./reducer";

interface StoreContextValue {
  state: HistoryState;
  dispatch: (action: MapAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: MapState;
}) {
  const [state, send] = useReducer(
    historyReducer,
    initial
      ? { ...initialHistoryState, present: initial }
      : initialHistoryState,
  );

  const dispatch = useCallback(
    (action: MapAction) => send({ type: "DO", action }),
    [],
  );
  const undo = useCallback(() => send({ type: "UNDO" }), []);
  const redo = useCallback(() => send({ type: "REDO" }), []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state, dispatch, undo, redo],
  );

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore må brukes inni StoreProvider");
  return ctx;
}

// Snarvei for komponenter som bare trenger gjeldende kart.
export function useMap() {
  return useStore().state.present;
}
