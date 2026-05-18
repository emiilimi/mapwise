import { useRef, useState } from "react";

interface Props {
  defaultSrc?: string;
  defaultAlt?: string;
  onConfirm: (result: { src: string; alt: string }) => void;
  onClose: () => void;
}

export function ImageDialog({
  defaultSrc = "",
  defaultAlt = "",
  onConfirm,
  onClose,
}: Props) {
  const [src, setSrc] = useState(defaultSrc);
  const [alt, setAlt] = useState(defaultAlt);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSrc(reader.result);
        setImgError(false);
        if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  }

  function confirm() {
    const trimmed = src.trim();
    if (!trimmed) return;
    onConfirm({ src: trimmed, alt: alt.trim() });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      confirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-96 flex-col gap-4 rounded-lg bg-white p-5 shadow-xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Sett inn bilde</span>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 hover:bg-neutral-100 text-sm"
          >
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">URL</span>
          <input
            autoFocus
            type="url"
            value={src}
            onChange={(e) => {
              setSrc(e.target.value);
              setImgError(false);
            }}
            placeholder="https://..."
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs text-neutral-400">eller</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Last opp fra fil…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        {src && !imgError && (
          <img
            src={src}
            alt={alt}
            className="max-h-40 w-full rounded border border-neutral-200 object-contain"
            onError={() => setImgError(true)}
          />
        )}
        {src && imgError && (
          <p className="text-xs text-red-500">Klarte ikke å laste bildet.</p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Alternativ tekst (valgfri)</span>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Beskrivelse av bildet"
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            Avbryt
          </button>
          <button
            onClick={confirm}
            disabled={!src.trim()}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Sett inn
          </button>
        </div>
      </div>
    </div>
  );
}
