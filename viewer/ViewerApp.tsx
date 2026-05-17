import { useEffect } from "react";
import { StoreProvider } from "../src/state/store";
import { ToolProvider, useTool } from "../src/hooks/useTool";
import { PresentMode } from "../src/present/PresentMode";
import type { MapState } from "../src/state/reducer";

function ViewerBoot() {
  const { openPresent } = useTool();
  useEffect(() => {
    openPresent("explore");
  }, [openPresent]);
  return <PresentMode embedded />;
}

interface Props {
  initial: MapState;
}

export function ViewerApp({ initial }: Props) {
  return (
    <StoreProvider initial={initial}>
      <ToolProvider>
        <ViewerBoot />
      </ToolProvider>
    </StoreProvider>
  );
}
