import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

export function ToolButton({
  icon,
  label,
  shortcut,
  active = false,
  disabled = false,
  title,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={
        "flex h-14 w-14 flex-col items-center justify-center rounded-md text-[10px] transition-colors " +
        (active
          ? "bg-blue-600 text-white"
          : "text-neutral-700 hover:bg-neutral-100") +
        (disabled ? " cursor-not-allowed opacity-40 hover:bg-transparent" : "")
      }
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="mt-0.5">{label}</span>
      {shortcut && (
        <span
          className={
            "text-[9px] " + (active ? "text-blue-100" : "text-neutral-400")
          }
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}
