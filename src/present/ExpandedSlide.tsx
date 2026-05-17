import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseFrontmatter } from "../lib/frontmatter";
import { useMap } from "../state/store";

interface Props {
  slideId: string;
  onClose: () => void;
}

export function ExpandedSlide({ slideId, onClose }: Props) {
  const map = useMap();
  const node = map.nodes.find((n) => n.id === slideId);
  const { slide, thumbnail, body } = useMemo(() => {
    if (!node || node.type !== "slide")
      return { slide: null, thumbnail: null, body: "" };
    return parseFrontmatter(node.markdown);
  }, [node]);

  if (!node || node.type !== "slide") return null;

  const fullscreen = map.settings.clickBehavior === "fullscreen";

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          "flex flex-col rounded-lg bg-white shadow-2xl " +
          (fullscreen ? "h-[92vh] w-[92vw]" : "h-[70vh] w-[60vw] max-w-3xl")
        }
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            {slide !== null && (
              <span className="rounded bg-blue-600 px-2 py-0.5 text-white">
                Slide {slide}
              </span>
            )}
            {thumbnail && <span>{thumbnail}</span>}
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 hover:bg-neutral-100"
            title="Lukk (Esc)"
          >
            ✕
          </button>
        </div>
        <div className="markdown-body flex-1 overflow-auto p-8 text-base leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
