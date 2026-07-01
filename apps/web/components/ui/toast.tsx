"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; message: string; type: ToastType };
type ToastCtx = { toast: (message: string, type?: ToastType) => void };

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 border px-4 py-3 text-sm shadow-lg animate-toast-in backdrop-blur-sm ${
              t.type === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : t.type === "error"
                ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                : "border-sky-200/30 bg-sky-200/10 text-sky-200"
            }`}
          >
            <span className="mt-0.5 shrink-0 text-xs">
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
            </span>
            <span className="flex-1 leading-5">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-40 hover:opacity-100 transition text-xs mt-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
