"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Confirm/primary action */
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm?: () => void;
  loading?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  loading,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-md border border-white/15 bg-[#0d1424] p-6 shadow-2xl animate-fade-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/30 hover:text-white/70 transition text-sm"
        >
          ✕
        </button>

        <h2 className="font-[var(--font-pixel)] text-base text-white pr-6">{title}</h2>
        {description && (
          <p className="mt-3 text-sm text-white/55 leading-6">{description}</p>
        )}

        {children && <div className="mt-4">{children}</div>}

        {(confirmLabel || onConfirm) && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-white/15 py-2.5 text-sm text-white/60 hover:border-white/30 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 border py-2.5 text-sm transition disabled:opacity-40 ${
                confirmVariant === "danger"
                  ? "border-rose-400/40 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
                  : "border-sky-200/40 bg-sky-200/10 text-sky-200 hover:bg-sky-200/20"
              }`}
            >
              {loading ? "…" : confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
