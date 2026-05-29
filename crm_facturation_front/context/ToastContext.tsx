"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, ShieldOff } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "error" | "warning" | "info";
}

interface ToastContextType {
  showPermissionDenied: (message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showPermissionDenied = useCallback(
    (message = "You don't have permission to perform this action.") => {
      const id = ++toastCounter;
      setToasts((prev) => [...prev, { id, message, type: "error" }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  // Listen for the custom DOM event dispatched by api.ts (outside React context)
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      showPermissionDenied(detail?.message);
    };
    window.addEventListener("api:permission-denied", handler);
    return () => window.removeEventListener("api:permission-denied", handler);
  }, [showPermissionDenied]);

  return (
    <ToastContext.Provider value={{ showPermissionDenied }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 bg-white border border-red-200 shadow-lg rounded-xl px-4 py-3 max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <ShieldOff className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-slate-700 flex-1">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
