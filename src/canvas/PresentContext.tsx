import { createContext, useContext } from "react";

// SlideNode renderes både i editoren og i utforsk-modus. Vi trenger en måte
// for noden å vite hvilken kontekst den lever i (uten å lese
// document.body.dataset). Provideren wrapper ReactFlow i ExploreView.
export const PresentContext = createContext<{ inPresent: boolean }>({
  inPresent: false,
});

export function usePresentContext() {
  return useContext(PresentContext);
}
