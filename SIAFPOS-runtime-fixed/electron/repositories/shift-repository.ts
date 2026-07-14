import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { CashShift } from "../../shared/contracts/billing-contracts";

type ShiftRow = {
  uuid: string; terminal_uuid: string; user_uuid: string; status: "open" | "closed";
  opening_cash_minor: number; actual_cash_minor: number | null; difference_minor: number | null;
  opened_at: string; closed_at: string | null; closing_note: string | null;
};

export class ShiftRepository {
  constructor(private readonly db: Database.Database) {}
  getOpen(terminalUuid: string): CashShift | null {
    const row = this.db.prepare("SELECT * FROM cash_shifts WHERE terminal_uuid = ? AND status = 'open' ORDER BY id DESC LIMIT 1").get(terminalUuid) as ShiftRow | undefined;
    return row ? this.map(row) : null;
  }
  open(terminalUuid: string, userUuid: string, openingCashMinor: number, now: string): CashShift {
    const uuid = randomUUID();
    this.db.prepare(`INSERT INTO cash_shifts (uuid, terminal_uuid, user_uuid, status, opening_cash_minor, expected_cash_minor, opened_at)
      VALUES (?, ?, ?, 'open', ?, ?, ?)`)
      .run(uuid, terminalUuid, userUuid, openingCashMinor, openingCashMinor, now);
    return this.getOpen(terminalUuid)!;
  }
  cashSales(shiftUuid: string): number {
    const row = this.db.prepare(`SELECT COALESCE(SUM(p.amount_minor - p.change_minor), 0) AS total
      FROM payments p JOIN bills b ON b.uuid = p.bill_uuid WHERE b.shift_uuid = ? AND b.status = 'settled' AND p.payment_mode = 'cash'`)
      .get(shiftUuid) as { total: number };
    return row.total;
  }
  close(shiftUuid: string, actual: number, expected: number, note: string | null, now: string): void {
    this.db.prepare(`UPDATE cash_shifts SET status='closed', expected_cash_minor=?, actual_cash_minor=?, difference_minor=?, closing_note=?, closed_at=? WHERE uuid=? AND status='open'`)
      .run(expected, actual, actual - expected, note, now, shiftUuid);
  }
  get(uuid: string): CashShift | null {
    const row = this.db.prepare("SELECT * FROM cash_shifts WHERE uuid = ?").get(uuid) as ShiftRow | undefined;
    return row ? this.map(row) : null;
  }
  private map(row: ShiftRow): CashShift {
    const cashSalesMinor = this.cashSales(row.uuid);
    const expectedCashMinor = row.opening_cash_minor + cashSalesMinor;
    return { uuid: row.uuid, terminalUuid: row.terminal_uuid, userUuid: row.user_uuid, status: row.status,
      openingCashMinor: row.opening_cash_minor, cashSalesMinor, expectedCashMinor,
      actualCashMinor: row.actual_cash_minor, differenceMinor: row.difference_minor, openedAt: row.opened_at,
      closedAt: row.closed_at, closingNote: row.closing_note };
  }
}
