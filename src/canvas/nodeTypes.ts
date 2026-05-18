import { SlideNode } from "./SlideNode";
import { TextNode } from "./TextNode";
import { ImageNode } from "./ImageNode";

// Felles registry for React Flow. Holdes som modulkonstant for å unngå
// re-mount av nodekomponenter ved hver Canvas-render.
export const nodeTypes = {
  slide: SlideNode,
  text: TextNode,
  image: ImageNode,
};
