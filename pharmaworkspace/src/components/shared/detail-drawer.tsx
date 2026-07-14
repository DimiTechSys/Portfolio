"use client";

import {
  useEffect,
  useCallback,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// Slot d'en-tête : permet à FormActions de téléporter ses boutons (Annuler /
// submit) dans la barre de titre du drawer, à côté du bouton de fermeture.
// undefined = pas dans un DetailDrawer ; null = dans un drawer mais slot pas
// encore monté ; HTMLElement = prêt à recevoir le portal.
const DrawerActionsSlotContext = createContext<HTMLElement | null | undefined>(
  undefined
);

export function useDrawerActionsSlot() {
  return useContext(DrawerActionsSlotContext);
}

export interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
  centeredOnDesktop?: boolean;
}

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  actions,
  wide = false,
  width,
  className,
  centeredOnDesktop = false,
}: DetailDrawerProps) {
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

  const maxWidthClass =
    {
      sm: "md:max-w-sm",
      md: "md:max-w-md",
      lg: "md:max-w-lg",
      xl: "md:max-w-xl",
    }[width ?? (wide ? "xl" : "md")];

  // Close on Escape ---------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed z-50 flex flex-col bg-white shadow-2xl transition-all duration-300",
          "inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl border border-slate-200",
          centeredOnDesktop 
            ? "md:bottom-auto md:right-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[90vh] md:rounded-3xl md:border" 
            : "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:rounded-none md:border-l md:border-t-0",
          "w-full md:w-full",
          maxWidthClass,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="truncate text-base font-semibold text-slate-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {/* Cible du portal pour les boutons de FormActions (mode édition/création) */}
            <div ref={setActionsSlot} className="contents" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <DrawerActionsSlotContext.Provider value={actionsSlot}>
            {children}
          </DrawerActionsSlotContext.Provider>
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-100 px-5 py-3">{footer}</div>
        )}
      </aside>
    </>
  );
}


// ============================================================================
// FILE: src/components/layout/session-guard.tsx
// ============================================================================
