import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "./data-table";

interface Row {
  id: string;
  name: string;
  price: number;
}

const rows: Row[] = [
  { id: "1", name: "Ring", price: 1899 },
  { id: "2", name: "Necklace", price: 3299 },
];

const columns: DataTableColumn<Row>[] = [
  { header: "Name", cell: (row) => row.name },
  { header: "Price", cell: (row) => `₹${row.price}`, align: "right" },
];

describe("DataTable", () => {
  it("renders a header and a row per item", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Ring")).toBeInTheDocument();
    expect(screen.getByText("Necklace")).toBeInTheDocument();
    expect(screen.getByText("₹1899")).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(row: Row) => row.id} emptyMessage="No products yet." />);

    expect(screen.getByText("No products yet.")).toBeInTheDocument();
  });

  it("gives an empty header column (the row-actions convention) a screen-reader-only label instead of leaving it blank", () => {
    const actionColumns: DataTableColumn<Row>[] = [
      ...columns,
      { header: "", cell: (row) => <button type="button">Remove {row.name}</button> },
    ];
    render(<DataTable columns={actionColumns} rows={rows} rowKey={(row) => row.id} />);

    const headers = screen.getAllByRole("columnheader");
    expect(headers[2]).toHaveTextContent("Actions");
  });
});
