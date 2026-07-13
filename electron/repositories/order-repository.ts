import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { AppliedDiscount, OrderStatus, OrderType, RunningOrderSummary } from "../../shared/contracts/order-contracts";

export type OrderHeaderRow = {
  uuid: string;
  order_no: string;
  order_type: OrderType;
  status: OrderStatus;
  customer_uuid: string | null;
  table_uuid: string | null;
  waiter_uuid: string | null;
  discount_type: "fixed" | "percentage" | null;
  discount_value: number | null;
  discount_amount_minor: number;
  subtotal_minor: number;
  taxable_minor: number;
  tax_minor: number;
  grand_total_minor: number;
  held_at: string | null;
  opened_at: string;
  updated_at: string;
  created_by_user_uuid: string | null;
  terminal_uuid: string | null;
};

export type OrderItemRow = {
  uuid: string;
  order_uuid: string;
  product_uuid: string;
  product_name: string;
  variant_uuid: string | null;
  variant_name: string | null;
  qty: number;
  unit_price_minor: number;
  gst_mode: "inclusive" | "exclusive";
  gst_rate_basis_points: number;
  kitchen_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemModifierRow = {
  uuid: string;
  order_item_uuid: string;
  modifier_uuid: string;
  modifier_group_uuid: string;
  name: string;
  price_delta_minor: number;
};

export class OrderRepository {
  constructor(private readonly db: Database.Database) {}

  createDraft(orderType: OrderType, userUuid: string, terminalUuid: string, now: string): OrderHeaderRow {
    const uuid = randomUUID();
    const orderNo = `ORD-${Date.now().toString().slice(-8)}`;
    this.db
      .prepare(
        `INSERT INTO orders (
          uuid, order_no, order_type, status, discount_amount_minor, subtotal_minor, taxable_minor, tax_minor,
          grand_total_minor, opened_at, updated_at, created_by_user_uuid, terminal_uuid
        ) VALUES (?, ?, ?, 'draft', 0, 0, 0, 0, 0, ?, ?, ?, ?)`
      )
      .run(uuid, orderNo, orderType, now, now, userUuid, terminalUuid);

    return this.getHeader(uuid)!;
  }

  getHeader(orderUuid: string): OrderHeaderRow | null {
    return (this.db.prepare("SELECT * FROM orders WHERE uuid = ?").get(orderUuid) as OrderHeaderRow | undefined) ?? null;
  }

  listItems(orderUuid: string): OrderItemRow[] {
    return this.db
      .prepare("SELECT * FROM order_items WHERE order_uuid = ? ORDER BY created_at, id")
      .all(orderUuid) as OrderItemRow[];
  }

  listItemModifiers(orderItemUuids: string[]): OrderItemModifierRow[] {
    if (orderItemUuids.length === 0) {
      return [];
    }

    const placeholders = orderItemUuids.map(() => "?").join(", ");
    return this.db
      .prepare(`SELECT * FROM order_item_modifiers WHERE order_item_uuid IN (${placeholders}) ORDER BY id`)
      .all(...orderItemUuids) as OrderItemModifierRow[];
  }

  addItem(item: {
    orderUuid: string;
    productUuid: string;
    productName: string;
    variantUuid: string | null;
    variantName: string | null;
    qty: number;
    unitPriceMinor: number;
    gstMode: "inclusive" | "exclusive";
    gstRateBasisPoints: number;
    now: string;
  }): string {
    const uuid = randomUUID();
    this.db
      .prepare(
        `INSERT INTO order_items (
          uuid, order_uuid, product_uuid, product_name, variant_uuid, variant_name, qty, unit_price_minor,
          gst_mode, gst_rate_basis_points, kitchen_note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        uuid,
        item.orderUuid,
        item.productUuid,
        item.productName,
        item.variantUuid,
        item.variantName,
        item.qty,
        item.unitPriceMinor,
        item.gstMode,
        item.gstRateBasisPoints,
        null,
        item.now,
        item.now
      );

    return uuid;
  }

  updateItemQuantity(orderItemUuid: string, quantity: number, now: string): void {
    this.db.prepare("UPDATE order_items SET qty = ?, updated_at = ? WHERE uuid = ?").run(quantity, now, orderItemUuid);
  }

  updateItemVariant(orderItemUuid: string, variantUuid: string | null, variantName: string | null, unitPriceMinor: number, now: string): void {
    this.db
      .prepare("UPDATE order_items SET variant_uuid = ?, variant_name = ?, unit_price_minor = ?, updated_at = ? WHERE uuid = ?")
      .run(variantUuid, variantName, unitPriceMinor, now, orderItemUuid);
  }

  updateItemNote(orderItemUuid: string, kitchenNote: string | null, now: string): void {
    this.db.prepare("UPDATE order_items SET kitchen_note = ?, updated_at = ? WHERE uuid = ?").run(kitchenNote, now, orderItemUuid);
  }

  removeItem(orderItemUuid: string): void {
    this.db.prepare("DELETE FROM order_item_modifiers WHERE order_item_uuid = ?").run(orderItemUuid);
    this.db.prepare("DELETE FROM order_items WHERE uuid = ?").run(orderItemUuid);
  }

  replaceItemModifiers(orderItemUuid: string, modifiers: Array<{ modifierUuid: string; groupUuid: string; name: string; priceDeltaMinor: number }>, now: string): void {
    this.db.prepare("DELETE FROM order_item_modifiers WHERE order_item_uuid = ?").run(orderItemUuid);
    const insert = this.db.prepare(
      `INSERT INTO order_item_modifiers (uuid, order_item_uuid, modifier_uuid, modifier_group_uuid, name, price_delta_minor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const modifier of modifiers) {
      insert.run(randomUUID(), orderItemUuid, modifier.modifierUuid, modifier.groupUuid, modifier.name, modifier.priceDeltaMinor, now);
    }
  }

  setCustomer(orderUuid: string, customerUuid: string | null, now: string): void {
    this.db.prepare("UPDATE orders SET customer_uuid = ?, updated_at = ? WHERE uuid = ?").run(customerUuid, now, orderUuid);
  }

  setOrderType(orderUuid: string, orderType: OrderType, now: string): void {
    this.db.prepare("UPDATE orders SET order_type = ?, updated_at = ? WHERE uuid = ?").run(orderType, now, orderUuid);
  }

  setTable(orderUuid: string, tableUuid: string | null, now: string): void {
    this.db.prepare("UPDATE orders SET table_uuid = ?, updated_at = ? WHERE uuid = ?").run(tableUuid, now, orderUuid);
  }

  setWaiter(orderUuid: string, waiterUuid: string | null, now: string): void {
    this.db.prepare("UPDATE orders SET waiter_uuid = ?, updated_at = ? WHERE uuid = ?").run(waiterUuid, now, orderUuid);
  }

  setDiscount(orderUuid: string, discount: AppliedDiscount | null, now: string): void {
    this.db
      .prepare(
        `UPDATE orders
         SET discount_type = ?, discount_value = ?, discount_amount_minor = ?, updated_at = ?
         WHERE uuid = ?`
      )
      .run(discount?.type ?? null, discount?.value ?? null, discount?.amountMinor ?? 0, now, orderUuid);
  }

  updateTotals(orderUuid: string, status: OrderStatus, totals: { subtotalMinor: number; taxableMinor: number; taxMinor: number; grandTotalMinor: number }, heldAt: string | null, now: string): void {
    this.db
      .prepare(
        `UPDATE orders
         SET status = ?, subtotal_minor = ?, taxable_minor = ?, tax_minor = ?, grand_total_minor = ?, held_at = ?, updated_at = ?
         WHERE uuid = ?`
      )
      .run(status, totals.subtotalMinor, totals.taxableMinor, totals.taxMinor, totals.grandTotalMinor, heldAt, now, orderUuid);
  }

  hold(orderUuid: string, userUuid: string, now: string): void {
    this.db
      .prepare(
        `INSERT INTO held_orders (order_uuid, held_at, held_by_user_uuid, note)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(order_uuid) DO UPDATE SET held_at = excluded.held_at, held_by_user_uuid = excluded.held_by_user_uuid`
      )
      .run(orderUuid, now, userUuid, null);
  }

  recall(orderUuid: string): void {
    this.db.prepare("DELETE FROM held_orders WHERE order_uuid = ?").run(orderUuid);
  }

  listRunning(): RunningOrderSummary[] {
    const rows = this.db
      .prepare(
        `SELECT o.uuid, o.order_no, o.order_type, o.status, o.grand_total_minor, o.updated_at,
                t.name AS table_name, c.name AS customer_name, w.name AS waiter_name,
                COALESCE(SUM(oi.qty), 0) AS item_count
         FROM orders o
         LEFT JOIN tables t ON t.uuid = o.table_uuid
         LEFT JOIN customers c ON c.uuid = o.customer_uuid
         LEFT JOIN waiters w ON w.uuid = o.waiter_uuid
         LEFT JOIN order_items oi ON oi.order_uuid = o.uuid
         WHERE o.status IN ('draft', 'active')
           AND NOT EXISTS (SELECT 1 FROM bills b WHERE b.order_uuid = o.uuid AND b.status = 'settled')
         GROUP BY o.uuid
         ORDER BY o.updated_at DESC`
      )
      .all() as Array<{
      uuid: string;
      order_no: string;
      order_type: OrderType;
      status: OrderStatus;
      grand_total_minor: number;
      updated_at: string;
      table_name: string | null;
      customer_name: string | null;
      waiter_name: string | null;
      item_count: number;
    }>;

    return rows.map((row) => ({
      uuid: row.uuid,
      orderNo: row.order_no,
      orderType: row.order_type,
      status: row.status,
      itemCount: row.item_count,
      grandTotalMinor: row.grand_total_minor,
      tableName: row.table_name,
      customerName: row.customer_name,
      waiterName: row.waiter_name,
      updatedAt: row.updated_at
    }));
  }
}
