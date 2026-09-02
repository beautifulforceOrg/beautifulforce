import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  // For a numeric/right-aligned column (prices, quantities).
  align?: "left" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  // Caller supplies a stable key per row -- this component does no
  // fetching/filtering/sorting itself, only presentation.
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage = "Nothing to show." }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn("py-2 pr-4 font-medium", column.align === "right" && "text-right")}
              >
                {/* An empty header (this codebase's convention for a
                    row-actions column) still needs a screen-reader-visible
                    label -- axe's empty-table-header rule caught this. */}
                {column.header || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border text-foreground">
              {columns.map((column) => (
                <td key={column.header} className={cn("py-2 pr-4", column.align === "right" && "text-right")}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
