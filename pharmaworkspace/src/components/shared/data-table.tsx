"use client";

import { useState, useMemo, useCallback, useEffect, useLayoutEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { DEFAULT_PAGE_SIZE, PAGINATION_SIZES } from "@/config/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  loading?: boolean;
  className?: string;
  /** Met en avant la ligne (pulse ~2s), ex. après clic sur une notification */
  highlightRowId?: string | null;
  /** Classes additionnelles pour les cartes mobiles (par ligne). */
  mobileRowClassName?: (row: T) => string;
  /** Rendu mobile custom d'une carte ligne. */
  mobileRowRender?: (row: T) => ReactNode;
}

type SortDir = "asc" | "desc" | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = "Aucun élément",
  pageSize: initialPageSize,
  loading = false,
  className,
  highlightRowId,
  mobileRowClassName,
  mobileRowRender,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize ?? DEFAULT_PAGE_SIZE);

  // Sorting -----------------------------------------------------------------
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) =>
          prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
        );
        if (sortDir === "desc") setSortKey(null);
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortKey, sortDir]
  );

  const sorted = useMemo(() => {
    const clean = data.filter(Boolean)
    if (!sortKey || !sortDir) return clean;
    return [...clean].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null || bVal == null) return 0;
      const cmp = String(aVal).localeCompare(String(bVal), "fr", {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  // Pagination --------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize).filter(Boolean)

  useEffect(() => {
    if (!highlightRowId || loading) return;
    const idx = sorted.findIndex((r) => r.id === highlightRowId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / pageSize);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- jump to highlighted row's page when the row arrives or sort changes.
    setPage((p) => (p !== targetPage ? targetPage : p));
  }, [highlightRowId, sorted, loading, pageSize]);

  useLayoutEffect(() => {
    if (!highlightRowId || loading) return;
    const idx = sorted.findIndex((r) => r.id === highlightRowId);
    if (idx < 0) return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-highlight-row="${CSS.escape(highlightRowId)}"]`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightRowId, page, loading, sorted]);

  // Sort icon helper --------------------------------------------------------
  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey || !sortDir)
      return <ChevronsUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-gray-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-gray-600" />
    );
  };

  // Render ------------------------------------------------------------------
  return (
    <div className={cn("w-full", className)}>
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
        <table className="w-full text-sm">
          {/* Head */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500",
                    col.sortable && "cursor-pointer select-none",
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-gray-400"
                >
                  Chargement…
                </td>
              </tr>
            )}

            {!loading && paginated.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              paginated.map((row) => (
                <tr
                  key={row.id}
                  data-highlight-row={highlightRowId === row.id ? row.id : undefined}
                  className={cn(
                    "bg-white transition-colors",
                    onRowClick &&
                      "cursor-pointer hover:bg-gray-50/80",
                    highlightRowId === row.id && "row-highlight-pulse"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-gray-700",
                        col.className
                      )}
                    >
                      {col.render ? col.render((row as Record<string, unknown>)[col.key], row)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? ""
                          )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
            Chargement…
          </div>
        )}
        {!loading && paginated.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
            {emptyMessage}
          </div>
        )}
        {!loading &&
          paginated.map((row) => (
            <div
              key={row.id}
              data-highlight-row={highlightRowId === row.id ? row.id : undefined}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                "w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition",
                onRowClick && "cursor-pointer active:scale-[0.99]",
                highlightRowId === row.id && "row-highlight-pulse",
                mobileRowClassName?.(row)
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {mobileRowRender ? (
                mobileRowRender(row)
              ) : (
                <div className="space-y-2">
                  {columns.map((col, index) => (
                    <div key={col.key} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-gray-500">{col.header}</span>
                      <span
                        className={cn(
                          "text-sm text-gray-800",
                          index === 0 && "font-semibold text-gray-900"
                        )}
                      >
                        {col.render
                          ? col.render((row as Record<string, unknown>)[col.key], row)
                          : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Lignes par page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700 outline-none focus:border-gray-400"
            >
              {PAGINATION_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              {page * pageSize + 1}–
              {Math.min((page + 1) * pageSize, sorted.length)} sur{" "}
              {sorted.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded px-2 py-1 transition-colors hover:bg-gray-100 disabled:opacity-30"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                className="rounded px-2 py-1 transition-colors hover:bg-gray-100 disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================================
// FILE: src/components/shared/detail-drawer.tsx
// ============================================================================
