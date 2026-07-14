import { describe, expect, it } from "vitest";
import { center, columns, escposDocument } from "../electron/printers/escpos";

describe("Phase 4 ESC/POS formatter", () => {
  it("formats fixed-width receipt lines", () => {
    expect(center("POS", 9)).toBe("   POS");
    expect(columns("Total", "10.00", 16)).toHaveLength(16);
  });

  it("adds initialize, drawer and cut commands", () => {
    const data = escposDocument(["TEST"], { cut: true, drawer: true });
    expect(Array.from(data.subarray(0, 2))).toEqual([0x1b, 0x40]);
    expect(data.includes(Buffer.from([0x1b, 0x70]))).toBe(true);
    expect(data.includes(Buffer.from([0x1d, 0x56]))).toBe(true);
  });
});
