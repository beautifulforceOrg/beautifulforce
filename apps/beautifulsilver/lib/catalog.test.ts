import { describe, expect, it } from "vitest";
import { primaryImageUrl } from "./catalog";

describe("primaryImageUrl", () => {
  it("returns the first image's url", () => {
    expect(primaryImageUrl([{ url: "https://example.com/a.jpg" }, { url: "https://example.com/b.jpg" }])).toBe(
      "https://example.com/a.jpg"
    );
  });

  it("returns undefined when there are no images", () => {
    expect(primaryImageUrl([])).toBeUndefined();
  });
});
