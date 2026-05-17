import { useEffect, useRef } from "react";

export interface MenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Lukk på outside-klikk eller Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    // mousedown i stedet for click så klikket som åpner menyen ikke umiddelbart
    // lukker den (vi monteres etter mousedown).
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[140px] rounded-md border border-neutral-200 bg-white py-1 text-sm shadow-lg"
      style={{ left: x, top: y }}
    >
      {items.map((it) => (
        <button
          key={it.label}
          onClick={() => {
            it.onClick();
            onClose();
          }}
          className={
            "block w-full px-3 py-1 text-left hover:bg-neutral-100 " +
            (it.destructive ? "text-red-600" : "text-neutral-700")
          }
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
