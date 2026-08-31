import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./toast";

function TestButton({ text }: { text: string }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(text)}>
      Trigger
    </button>
  );
}

describe("ToastProvider / useToast", () => {
  it("shows a toast after showToast is called", async () => {
    render(
      <ToastProvider>
        <TestButton text="Product saved" />
      </ToastProvider>
    );

    expect(screen.queryByText("Product saved")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Trigger" }));
    expect(screen.getByText("Product saved")).toBeInTheDocument();
  });

  it("throws if useToast is called outside a ToastProvider", () => {
    function Broken() {
      useToast();
      return null;
    }
    expect(() => render(<Broken />)).toThrow("useToast must be used within a ToastProvider");
  });
});
