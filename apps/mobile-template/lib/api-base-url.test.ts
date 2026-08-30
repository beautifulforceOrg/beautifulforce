import { afterEach, describe, expect, it } from "vitest";
import { getApiBaseUrl } from "./api-base-url";

const ORIGINAL = process.env.EXPO_PUBLIC_API_BASE_URL;

afterEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = ORIGINAL;
});

describe("getApiBaseUrl", () => {
  it("defaults to the local apps/beautifulmess dev server", () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(getApiBaseUrl()).toBe("http://localhost:3000");
  });

  it("uses EXPO_PUBLIC_API_BASE_URL when a client app overrides it", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://beautifulmess.example.com";
    expect(getApiBaseUrl()).toBe("https://beautifulmess.example.com");
  });
});
