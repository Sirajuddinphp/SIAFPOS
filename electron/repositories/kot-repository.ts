import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type {
  KotItem,
  KotStatus,
  KotTicketDetail,
  KotTicketKind,
  KotTicketSummary
} from "../../shared/contracts/kot-contracts";
import type { OrderType } from "../../shared/contracts/order-contracts";

type KotTicketRow = {
  uuid: string;
  order_uuid: string;
  order_no: string;
  order_type: OrderType;
  status: KotStatus;
  kind: KotTicketKind;
  priority: number;
  kitchen_station: string | null;
  started_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  reference_kot_uuid: string | null;
  created_at: string;
  updated_at: string;
  printed_at: string | null;
  cancelled_at: string | null;
  table_name: string | null;
  waiter_name: string | null;
  customer_name: string | null;
  item_count: number;
};

type KotItemRow = {
  uuid: string;
  order_item_uuid: string;
  product_uuid: string;
  item_name_snapshot: string;
  variant_name_snapshot: string | null;
  qty: number;
  line_action: "add" | "update" | "cancel";
  kitchen_note_snapshot: string | null;
  modifier_snapshot_json: string;
};

type KotHistoryRow = {
  uuid: string;
  from_status: KotStatus | null;
  to_status: KotStatus;
  reason: string | null;
  created_at: string;
};

export type PersistKotItemInput = {
  orderItemUuid: string;
  productUuid: string;
  itemName: string;
  variantName: string | null;
  qty: number;
  lineAction: "add" | "update" | "cancel";
  kitchenNote: string | null;
  modifierSnapshotJson: string;
};

export class KotRepository {
  constructor(private readonly db: Database.Database) {}

  nextKotNo(): string {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM kot_tickets")
      .get() as { count: number };

    return `KOT-${String(row.count + 1).padStart(5, "0")}`;
  }

  createTicket(input: {
    orderUuid: string;
    status: KotStatus;
    kind: KotTicketKind;
    referenceKotUuid: string | null;
    createdByUserUuid: string;
    printedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
    items: PersistKotItemInput[];
    priority?: number;
    stationCode?: string | null;
  }): string {
    const uuid = randomUUID();

    this.db
      .prepare(`
        INSERT INTO kot_tickets (
          uuid,
          order_uuid,
          kot_no,
          status,
          kind,
          priority,
          kitchen_station,
          reference_kot_uuid,
          created_by_user_uuid,
          printed_at,
          cancelled_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        uuid,
        input.orderUuid,
        this.nextKotNo(),
        input.status,
        input.kind,
        input.priority ?? 0,
        input.stationCode ?? "MAIN",
        input.referenceKotUuid,
        input.createdByUserUuid,
        input.printedAt,
        input.cancelledAt,
        input.createdAt,
        input.updatedAt
      );

    const insertItem = this.db.prepare(`
      INSERT INTO kot_items (
        uuid,
        kot_ticket_uuid,
        order_item_uuid,
        product_uuid,
        item_name_snapshot,
        variant_name_snapshot,
        qty,
        line_action,
        kitchen_note_snapshot,
        modifier_snapshot_json,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of input.items) {
      insertItem.run(
        randomUUID(),
        uuid,
        item.orderItemUuid,
        item.productUuid,
        item.itemName,
        item.variantName,
        item.qty,
        item.lineAction,
        item.kitchenNote,
        item.modifierSnapshotJson,
        input.createdAt
      );
    }

    return uuid;
  }

  addStatusHistory(input: {
    kotTicketUuid: string;
    fromStatus: KotStatus | null;
    toStatus: KotStatus;
    changedByUserUuid: string;
    reason: string | null;
    createdAt: string;
  }): void {
    this.db
      .prepare(`
        INSERT INTO kot_status_history (
          uuid,
          kot_ticket_uuid,
          from_status,
          to_status,
          changed_by_user_uuid,
          reason,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        randomUUID(),
        input.kotTicketUuid,
        input.fromStatus,
        input.toStatus,
        input.changedByUserUuid,
        input.reason,
        input.createdAt
      );
  }

  updateTicketState(
    kotUuid: string,
    status: KotStatus,
    updatedAt: string,
    cancelledAt: string | null = null
  ): void {
    const timestamps = this.getStatusTimestampColumns(status);

    const result = this.db
      .prepare(`
        UPDATE kot_tickets
        SET status = ?,
            updated_at = ?,
            cancelled_at = COALESCE(?, cancelled_at),
            started_at = COALESCE(?, started_at),
            ready_at = COALESCE(?, ready_at),
            completed_at = COALESCE(?, completed_at)
        WHERE uuid = ?
      `)
      .run(
        status,
        updatedAt,
        cancelledAt,
        timestamps.startedAt,
        timestamps.readyAt,
        timestamps.completedAt,
        kotUuid
      );

    if (result.changes === 0) {
      throw new Error("KOT_NOT_FOUND");
    }
  }

  updatePriority(kotUuid: string, priority: number): void {
    const result = this.db
      .prepare(`
        UPDATE kot_tickets
        SET priority = ?,
            updated_at = ?
        WHERE uuid = ?
      `)
      .run(priority, new Date().toISOString(), kotUuid);

    if (result.changes === 0) {
      throw new Error("KOT_NOT_FOUND");
    }
  }

  updateStation(kotUuid: string, stationCode: string | null): void {
    const result = this.db
      .prepare(`
        UPDATE kot_tickets
        SET kitchen_station = ?,
            updated_at = ?
        WHERE uuid = ?
      `)
      .run(stationCode, new Date().toISOString(), kotUuid);

    if (result.changes === 0) {
      throw new Error("KOT_NOT_FOUND");
    }
  }

  getSummary(kotUuid: string): KotTicketSummary | null {
    const row = this.db
      .prepare(`
        SELECT
          kt.uuid,
          kt.order_uuid,
          o.order_no,
          o.order_type,
          kt.status,
          kt.kind,
          kt.priority,
          kt.kitchen_station,
          kt.started_at,
          kt.ready_at,
          kt.completed_at,
          kt.reference_kot_uuid,
          kt.created_at,
          kt.updated_at,
          kt.printed_at,
          kt.cancelled_at,
          t.name AS table_name,
          w.name AS waiter_name,
          c.name AS customer_name,
          COUNT(ki.uuid) AS item_count
        FROM kot_tickets kt
        INNER JOIN orders o ON o.uuid = kt.order_uuid
        LEFT JOIN tables t ON t.uuid = o.table_uuid
        LEFT JOIN waiters w ON w.uuid = o.waiter_uuid
        LEFT JOIN customers c ON c.uuid = o.customer_uuid
        LEFT JOIN kot_items ki ON ki.kot_ticket_uuid = kt.uuid
        WHERE kt.uuid = ?
        GROUP BY kt.uuid
      `)
      .get(kotUuid) as KotTicketRow | undefined;

    return row ? mapSummary(row) : null;
  }

  getDetail(kotUuid: string): KotTicketDetail | null {
    const row = this.db
      .prepare(`
        SELECT
          kt.uuid,
          kt.order_uuid,
          o.order_no,
          o.order_type,
          kt.status,
          kt.kind,
          kt.priority,
          kt.kitchen_station,
          kt.started_at,
          kt.ready_at,
          kt.completed_at,
          kt.reference_kot_uuid,
          kt.created_at,
          kt.updated_at,
          kt.printed_at,
          kt.cancelled_at,
          t.name AS table_name,
          w.name AS waiter_name,
          c.name AS customer_name,
          COUNT(ki.uuid) AS item_count
        FROM kot_tickets kt
        INNER JOIN orders o ON o.uuid = kt.order_uuid
        LEFT JOIN tables t ON t.uuid = o.table_uuid
        LEFT JOIN waiters w ON w.uuid = o.waiter_uuid
        LEFT JOIN customers c ON c.uuid = o.customer_uuid
        LEFT JOIN kot_items ki ON ki.kot_ticket_uuid = kt.uuid
        WHERE kt.uuid = ?
        GROUP BY kt.uuid
      `)
      .get(kotUuid) as KotTicketRow | undefined;

    if (!row) {
      return null;
    }

    const itemRows = this.db
      .prepare(`
        SELECT *
        FROM kot_items
        WHERE kot_ticket_uuid = ?
        ORDER BY id
      `)
      .all(kotUuid) as KotItemRow[];

    const historyRows = this.db
      .prepare(`
        SELECT
          uuid,
          from_status,
          to_status,
          reason,
          created_at
        FROM kot_status_history
        WHERE kot_ticket_uuid = ?
        ORDER BY id
      `)
      .all(kotUuid) as KotHistoryRow[];

    return {
      ...mapSummary(row),
      customerName: row.customer_name,
      items: itemRows.map(mapItem),
      history: historyRows.map((history) => ({
        uuid: history.uuid,
        fromStatus: history.from_status,
        toStatus: history.to_status,
        reason: history.reason,
        createdAt: history.created_at
      }))
    };
  }

  listByOrder(orderUuid: string): KotTicketSummary[] {
    const rows = this.db
      .prepare(`
        SELECT
          kt.uuid,
          kt.order_uuid,
          o.order_no,
          o.order_type,
          kt.status,
          kt.kind,
          kt.priority,
          kt.kitchen_station,
          kt.started_at,
          kt.ready_at,
          kt.completed_at,
          kt.reference_kot_uuid,
          kt.created_at,
          kt.updated_at,
          kt.printed_at,
          kt.cancelled_at,
          t.name AS table_name,
          w.name AS waiter_name,
          c.name AS customer_name,
          COUNT(ki.uuid) AS item_count
        FROM kot_tickets kt
        INNER JOIN orders o ON o.uuid = kt.order_uuid
        LEFT JOIN tables t ON t.uuid = o.table_uuid
        LEFT JOIN waiters w ON w.uuid = o.waiter_uuid
        LEFT JOIN customers c ON c.uuid = o.customer_uuid
        LEFT JOIN kot_items ki ON ki.kot_ticket_uuid = kt.uuid
        WHERE kt.order_uuid = ?
        GROUP BY kt.uuid
        ORDER BY kt.created_at DESC, kt.id DESC
      `)
      .all(orderUuid) as KotTicketRow[];

    return rows.map(mapSummary);
  }

  listActiveTickets(stationCode?: string | null): KotTicketSummary[] {
    const rows = this.db
      .prepare(`
        SELECT
          kt.uuid,
          kt.order_uuid,
          o.order_no,
          o.order_type,
          kt.status,
          kt.kind,
          kt.priority,
          kt.kitchen_station,
          kt.started_at,
          kt.ready_at,
          kt.completed_at,
          kt.reference_kot_uuid,
          kt.created_at,
          kt.updated_at,
          kt.printed_at,
          kt.cancelled_at,
          t.name AS table_name,
          w.name AS waiter_name,
          c.name AS customer_name,
          COUNT(ki.uuid) AS item_count
        FROM kot_tickets kt
        INNER JOIN orders o ON o.uuid = kt.order_uuid
        LEFT JOIN tables t ON t.uuid = o.table_uuid
        LEFT JOIN waiters w ON w.uuid = o.waiter_uuid
        LEFT JOIN customers c ON c.uuid = o.customer_uuid
        LEFT JOIN kot_items ki ON ki.kot_ticket_uuid = kt.uuid
        WHERE kt.status IN ('new', 'preparing', 'ready')
          AND kt.kind != 'reprint'
          AND kt.cancelled_at IS NULL
          AND (? IS NULL OR kt.kitchen_station = ?)
        GROUP BY kt.uuid
        ORDER BY
          kt.priority DESC,
          kt.created_at ASC,
          kt.id ASC
      `)
      .all(stationCode ?? null, stationCode ?? null) as KotTicketRow[];

    return rows.map(mapSummary);
  }

  listTicketRowsByOrder(
    orderUuid: string
  ): Array<KotTicketSummary & { items: KotItem[] }> {
    return [...this.listByOrder(orderUuid)]
      .reverse()
      .map((summary) => ({
        ...summary,
        items: this.listItems(summary.uuid)
      }));
  }

  listItems(kotUuid: string): KotItem[] {
    const rows = this.db
      .prepare(`
        SELECT *
        FROM kot_items
        WHERE kot_ticket_uuid = ?
        ORDER BY id
      `)
      .all(kotUuid) as KotItemRow[];

    return rows.map(mapItem);
  }

  getOrderContext(
    orderUuid: string
  ): { orderNo: string; orderType: OrderType } | null {
    const row = this.db
      .prepare(`
        SELECT order_no, order_type
        FROM orders
        WHERE uuid = ?
      `)
      .get(orderUuid) as
      | {
          order_no: string;
          order_type: OrderType;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      orderNo: row.order_no,
      orderType: row.order_type
    };
  }

  private getStatusTimestampColumns(status: KotStatus): {
    startedAt: string | null;
    readyAt: string | null;
    completedAt: string | null;
  } {
    const now = new Date().toISOString();

    return {
      startedAt: status === "preparing" ? now : null,
      readyAt: status === "ready" ? now : null,
      completedAt: status === "completed" ? now : null
    };
  }
}

function mapSummary(row: KotTicketRow): KotTicketSummary {
  return {
    uuid: row.uuid,
    orderUuid: row.order_uuid,
    orderNo: row.order_no,
    orderType: row.order_type,
    status: row.status,
    kind: row.kind,
    priority: row.priority,
    stationCode: row.kitchen_station,
    startedAt: row.started_at,
    readyAt: row.ready_at,
    completedAt: row.completed_at,
    itemCount: row.item_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    printedAt: row.printed_at,
    cancelledAt: row.cancelled_at,
    referenceKotUuid: row.reference_kot_uuid,
    tableName: row.table_name,
    waiterName: row.waiter_name
  };
}

function mapItem(row: KotItemRow): KotItem {
  let modifierNames: string[] = [];

  try {
    const parsed = JSON.parse(row.modifier_snapshot_json) as unknown;

    if (Array.isArray(parsed)) {
      modifierNames = parsed.filter(
        (value): value is string => typeof value === "string"
      );
    }
  } catch {
    modifierNames = [];
  }

  return {
    uuid: row.uuid,
    orderItemUuid: row.order_item_uuid,
    productUuid: row.product_uuid,
    itemName: row.item_name_snapshot,
    variantName: row.variant_name_snapshot,
    qty: row.qty,
    lineAction: row.line_action,
    kitchenNote: row.kitchen_note_snapshot,
    modifierNames
  };
}