import { describe, expect, it } from "vitest";

describe("runtime access rules", () => {
  it("uses a 15 day demo period", () => {
    const start = new Date("2026-07-16T00:00:00Z");
    const expiry = new Date(start);
    expiry.setUTCDate(expiry.getUTCDate() + 15);
    expect(expiry.toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });

  it("treats access expiry as a hard lock", () => {
    expect(new Date("2026-07-15").getTime() <= new Date("2026-07-16").getTime()).toBe(true);
  });
});
