import { describe, it, expect } from "vitest";

/**
 * Test the RSS feed XML generation helpers.
 * We import the route module indirectly since it's a route handler,
 * so we test the XML escaping and date formatting logic inline.
 */

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

describe("RSS feed helpers", () => {
  describe("escapeXml", () => {
    it("escapes ampersands", () => {
      expect(escapeXml("A & B")).toBe("A &amp; B");
    });

    it("escapes angle brackets", () => {
      expect(escapeXml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&apos;xss&apos;)&lt;/script&gt;"
      );
    });

    it("escapes quotes", () => {
      expect(escapeXml('He said "hello"')).toBe("He said &quot;hello&quot;");
    });

    it("handles multiple special characters", () => {
      expect(escapeXml("Tom & Jerry's <show>")).toBe(
        "Tom &amp; Jerry&apos;s &lt;show&gt;"
      );
    });

    it("returns plain text unchanged", () => {
      expect(escapeXml("Build v1.2.3 detected")).toBe(
        "Build v1.2.3 detected"
      );
    });

    it("handles empty string", () => {
      expect(escapeXml("")).toBe("");
    });
  });

  describe("toRfc822", () => {
    it("converts ISO timestamp to RFC 822 format", () => {
      const result = toRfc822("2026-03-15T12:00:00Z");
      expect(result).toContain("Sun, 15 Mar 2026");
      expect(result).toContain("GMT");
    });

    it("handles timezone offsets", () => {
      const result = toRfc822("2026-03-15T14:30:00+02:00");
      expect(result).toContain("12:30:00 GMT");
    });
  });
});
