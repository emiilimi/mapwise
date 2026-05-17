import { useEffect, useMemo, useRef, useState } from "react";
import { useTool } from "../hooks/useTool";
import { useMap, useStore } from "../state/store";
import { parseFrontmatter } from "../lib/frontmatter";
import type { SlideNode, TextNode } from "../types";

export function NodeEditor() {
  const { editingId, closeEditor } = useTool();
  const map = useMap();
  const { dispatch } = useStore();

  const node = useMemo(
    () => map.nodes.find((n) => n.id === editingId) ?? null,
    [map.nodes, editingId],
  );

  if (!node || !editingId) return null;
  return (
    <EditorImpl
      key={editingId}
      node={node}
      onClose={closeEditor}
      onSave={(patch) => {
        dispatch({ type: "UPDATE_NODE", id: editingId, patch });
        closeEditor();
      }}
    />
  );
}

interface EditorImplProps {
  node: SlideNode | TextNode;
  onClose: () => void;
  onSave: (patch: Partial<SlideNode> | Partial<TextNode>) => void;
}

function EditorImpl({ node, onClose, onSave }: EditorImplProps) {
  const initialText = node.type === "slide" ? node.markdown : node.content;
  const [text, setText] = useState(initialText);
  const dirty = text !== initialText;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fokus textarea ved åpning og plasser markør på slutten.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.selectionStart = ta.value.length;
    ta.selectionEnd = ta.value.length;
  }, []);

  // Live frontmatter-preview — viser hva parseren faktisk leser ut.
  const preview = useMemo(() => {
    if (node.type !== "slide") return null;
    const fm = parseFrontmatter(text);
    return fm;
  }, [text, node.type]);

  function save() {
    if (node.type === "slide") onSave({ markdown: text });
    else onSave({ content: text });
  }

  function tryClose() {
    if (!dirty || confirm("Forkaste endringene?")) onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      tryClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) tryClose();
      }}
    >
      <div
        className="flex h-full w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
          <div className="text-sm font-medium">
            {node.type === "slide" ? "Rediger slide" : "Rediger tekstnotat"}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Ctrl+S lagrer · Esc lukker</span>
            <button
              onClick={tryClose}
              className="rounded px-2 py-1 hover:bg-neutral-100"
            >
              Avbryt
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Lagre
            </button>
          </div>
        </div>

        {preview && (
          <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-1.5 font-mono text-xs text-neutral-600">
            <span className="mr-3">
              slide:{" "}
              <span className={preview.slide === null ? "text-neutral-400" : "text-neutral-900"}>
                {preview.slide ?? "—"}
              </span>
            </span>
            <span className="mr-3">
              thumbnail:{" "}
              <span className={preview.thumbnail === null ? "text-neutral-400" : "text-neutral-900"}>
                {preview.thumbnail ?? "—"}
              </span>
            </span>
            <span className="mr-3">
              summary:{" "}
              <span className={preview.summary === null ? "text-neutral-400" : "text-neutral-900"}>
                {preview.summary ?? "—"}
              </span>
            </span>
            <span className="mr-3">
              textSize:{" "}
              <span className={preview.textSize === null ? "text-neutral-400" : "text-neutral-900"}>
                {preview.textSize ?? "—"}
              </span>
            </span>
            <span>
              fixedForm:{" "}
              <span className={preview.fixedForm === null ? "text-neutral-400" : "text-neutral-900"}>
                {preview.fixedForm === null ? "—" : String(preview.fixedForm)}
              </span>
            </span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none p-4 font-mono text-sm leading-relaxed outline-none"
        />
      </div>
    </div>
  );
}
