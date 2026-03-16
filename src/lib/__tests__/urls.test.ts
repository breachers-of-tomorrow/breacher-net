import { describe, it, expect } from "vitest";
import { URLS, SITE_URL, youtubeEmbed } from "@/lib/urls";

describe("SITE_URL", () => {
  it("defaults to breacher.net", () => {
    expect(SITE_URL).toBe("https://breacher.net");
  });
});

describe("URLS", () => {
  it("contains required community links", () => {
    expect(URLS.discord).toMatch(/^https:\/\/discord\.gg\//);
    expect(URLS.wiki).toBe("https://wiki.breacher.net");
    expect(URLS.communityDoc).toMatch(/^https:\/\/docs\.google\.com\//);
  });

  it("contains external tracker links", () => {
    expect(URLS.winnower).toMatch(/^https:\/\//);
    expect(URLS.tauCeti).toMatch(/^https:\/\//);
    expect(URLS.cryoarchive).toBe("https://cryoarchive.systems");
    expect(URLS.cryoarchiveIndex).toBe("https://cryoarchive.systems/indx");
  });

  it("contains GitHub links", () => {
    expect(URLS.github).toMatch(/github\.com\/breachers-of-tomorrow/);
    expect(URLS.discussions).toMatch(/discussions$/);
    expect(URLS.breacherNetRepo).toMatch(/breacher-net$/);
  });

  it("all URLs are valid https", () => {
    for (const [key, url] of Object.entries(URLS)) {
      expect(url, `URLS.${key} should be https`).toMatch(/^https:\/\//);
    }
  });
});

describe("youtubeEmbed", () => {
  it("builds a YouTube embed URL", () => {
    expect(youtubeEmbed("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("handles arbitrary video IDs", () => {
    expect(youtubeEmbed("abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });
});
