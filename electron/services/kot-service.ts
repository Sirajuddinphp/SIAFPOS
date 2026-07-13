import type Database from "better-sqlite3";
import type { KotItem, KotPreview, KotStatus, KotTicketDetail } from "../../shared/contracts/kot-contracts";
import { KotRepository, type PersistKotItemInput } from "../repositories/kot-repository";
import { OrderRepository, type OrderItemModifierRow, type OrderItemRow } from "../repositories/order-repository";

type KitchenStateItem = {
  orderItemUuid: string;
  productUuid: string;
  itemName: string;
  variantName: string | null;
  qty: number;
  kitchenNote: string | null;
  modifierNames: string[];
};

export class KotService {
  private readonly orders: OrderRepository;
  private readonly kot: KotRepository;

  constructor(private readonly db: Database.Database) {
    this.orders = new OrderRepository(db);
    this.kot = new KotRepository(db);
  }

  preview(orderUuid: string): KotPreview {
    const context = this.kot.getOrderContext(orderUuid);
    if (!context) {
      throw new KotError("NOT_FOUND", "Order not found.");
    }

    const items = this.buildDelta(orderUuid);
    if (items.length === 0) {
      throw new KotError("NO_KOT_CHANGES", "There are no kitchen changes to send.");
    }

    return {
      orderUuid,
      orderNo: context.orderNo,
      orderType: context.orderType,
      ticketKind: this.kot.listByOrder(orderUuid).some((ticket) => ticket.kind !== "reprint") ? "delta" : "full",
      items: items.map(mapPersistedItemToContract)
    };
  }

  create(orderUuid: string, userUuid: string): KotTicketDetail {
    const preview = this.preview(orderUuid);
    const now = new Date().toISOString();
    const create = this.db.transaction(() => {
      const ticketUuid = this.kot.createTicket({
        orderUuid,
        status: "new",
        kind: preview.ticketKind,
        referenceKotUuid: this.kot.listByOrder(orderUuid).find((ticket) => ticket.kind !== "reprint")?.uuid ?? null,
        createdByUserUuid: userUuid,
        printedAt: now,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
        items: preview.items.map((item) => ({
          orderItemUuid: item.orderItemUuid,
          productUuid: item.productUuid,
          itemName: item.itemName,
          variantName: item.variantName,
          qty: item.qty,
          lineAction: item.lineAction,
          kitchenNote: item.kitchenNote,
          modifierSnapshotJson: JSON.stringify(item.modifierNames)
        }))
      });

      this.kot.addStatusHistory({
        kotTicketUuid: ticketUuid,
        fromStatus: null,
        toStatus: "new",
        changedByUserUuid: userUuid,
        reason: preview.ticketKind === "full" ? "Initial KOT" : "Delta KOT",
        createdAt: now
      });

      return ticketUuid;
    });

    return this.requireDetail(create());
  }

  get(kotUuid: string): KotTicketDetail {
    return this.requireDetail(kotUuid);
  }

  listByOrder(orderUuid: string) {
    return this.kot.listByOrder(orderUuid);
  }

  cancel(kotUuid: string, userUuid: string, reason?: string): KotTicketDetail {
    const target = this.requireDetail(kotUuid);
    if (target.status !== "new" || target.cancelledAt) {
      throw new KotError("INVALID_STATE", "Only new KOT tickets can be cancelled.");
    }

    const now = new Date().toISOString();
    const create = this.db.transaction(() => {
      this.kot.updateTicketState(target.uuid, "new", now, now);
      const cancelUuid = this.kot.createTicket({
        orderUuid: target.orderUuid,
        status: "new",
        kind: "cancel",
        referenceKotUuid: target.uuid,
        createdByUserUuid: userUuid,
        printedAt: now,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
        items: target.items.map((item) => ({
          orderItemUuid: item.orderItemUuid,
          productUuid: item.productUuid,
          itemName: item.itemName,
          variantName: item.variantName,
          qty: item.qty,
          lineAction: "cancel",
          kitchenNote: item.kitchenNote,
          modifierSnapshotJson: JSON.stringify(item.modifierNames)
        }))
      });
      this.kot.addStatusHistory({
        kotTicketUuid: cancelUuid,
        fromStatus: null,
        toStatus: "new",
        changedByUserUuid: userUuid,
        reason: reason ?? "KOT cancelled",
        createdAt: now
      });
      return cancelUuid;
    });

    return this.requireDetail(create());
  }

  markStarted(kotUuid: string, userUuid: string): KotTicketDetail {
    return this.transition(kotUuid, "new", "preparing", userUuid);
  }

  markReady(kotUuid: string, userUuid: string): KotTicketDetail {
    return this.transition(kotUuid, "preparing", "ready", userUuid);
  }

  markCompleted(kotUuid: string, userUuid: string): KotTicketDetail {
    return this.transition(kotUuid, "ready", "completed", userUuid);
  }

  reprint(kotUuid: string, userUuid: string): KotTicketDetail {
    const target = this.requireDetail(kotUuid);
    const now = new Date().toISOString();
    const create = this.db.transaction(() => {
      const reprintUuid = this.kot.createTicket({
        orderUuid: target.orderUuid,
        status: target.status,
        kind: "reprint",
        referenceKotUuid: target.uuid,
        createdByUserUuid: userUuid,
        printedAt: now,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
        items: target.items.map((item) => ({
          orderItemUuid: item.orderItemUuid,
          productUuid: item.productUuid,
          itemName: item.itemName,
          variantName: item.variantName,
          qty: item.qty,
          lineAction: item.lineAction,
          kitchenNote: item.kitchenNote,
          modifierSnapshotJson: JSON.stringify(item.modifierNames)
        }))
      });
      this.kot.addStatusHistory({
        kotTicketUuid: reprintUuid,
        fromStatus: target.status,
        toStatus: target.status,
        changedByUserUuid: userUuid,
        reason: "KOT reprint",
        createdAt: now
      });
      return reprintUuid;
    });

    return this.requireDetail(create());
  }

  private transition(kotUuid: string, expected: KotStatus, next: KotStatus, userUuid: string): KotTicketDetail {
    const target = this.requireDetail(kotUuid);
    if (target.cancelledAt) {
      throw new KotError("INVALID_STATE", "Cancelled KOT tickets cannot be updated.");
    }
    if (target.status !== expected) {
      throw new KotError("INVALID_STATE", `KOT must be ${expected} before it can move to ${next}.`);
    }

    const now = new Date().toISOString();
    const update = this.db.transaction(() => {
      this.kot.updateTicketState(kotUuid, next, now);
      this.kot.addStatusHistory({
        kotTicketUuid: kotUuid,
        fromStatus: expected,
        toStatus: next,
        changedByUserUuid: userUuid,
        reason: null,
        createdAt: now
      });
    });
    update();
    return this.requireDetail(kotUuid);
  }

  private requireDetail(kotUuid: string): KotTicketDetail {
    const detail = this.kot.getDetail(kotUuid);
    if (!detail) {
      throw new KotError("NOT_FOUND", "KOT not found.");
    }
    return detail;
  }

  private buildDelta(orderUuid: string): PersistKotItemInput[] {
    const rows = this.orders.listItems(orderUuid);
    if (rows.length === 0) {
      throw new KotError("INVALID_STATE", "Add items before sending KOT.");
    }

    const modifiers = this.orders.listItemModifiers(rows.map((item) => item.uuid));
    const currentItems = rows.map((row) => mapCurrentOrderItem(row, modifiers.filter((modifier) => modifier.order_item_uuid === row.uuid)));
    const sentState = this.currentKitchenState(orderUuid);
    const currentMap = new Map(currentItems.map((item) => [item.orderItemUuid, item]));
    const changes: PersistKotItemInput[] = [];

    for (const item of currentItems) {
      const previous = sentState.get(item.orderItemUuid);
      if (!previous) {
        changes.push(toPersistItem(item, item.qty, "add"));
        continue;
      }

      const variantChanged = previous.variantName !== item.variantName;
      const modifierChanged = JSON.stringify(previous.modifierNames) !== JSON.stringify(item.modifierNames);
      if (variantChanged || modifierChanged) {
        changes.push(toPersistItem(previous, previous.qty, "cancel"));
        changes.push(toPersistItem(item, item.qty, "add"));
        continue;
      }

      if (previous.kitchenNote !== item.kitchenNote) {
        changes.push(toPersistItem(item, item.qty, "update"));
      }

      if (item.qty > previous.qty) {
        changes.push(toPersistItem(item, item.qty - previous.qty, "add"));
      } else if (item.qty < previous.qty) {
        changes.push(toPersistItem(previous, previous.qty - item.qty, "cancel"));
      }
    }

    for (const [orderItemUuid, previous] of sentState.entries()) {
      if (!currentMap.has(orderItemUuid)) {
        changes.push(toPersistItem(previous, previous.qty, "cancel"));
      }
    }

    return changes;
  }

  private currentKitchenState(orderUuid: string): Map<string, KitchenStateItem> {
    const tickets = this.kot.listTicketRowsByOrder(orderUuid);
    const state = new Map<string, KitchenStateItem>();

    for (const ticket of tickets) {
      if (ticket.kind === "reprint") {
        continue;
      }

      for (const item of ticket.items) {
        const current = state.get(item.orderItemUuid);
        if (item.lineAction === "add") {
          state.set(item.orderItemUuid, {
            orderItemUuid: item.orderItemUuid,
            productUuid: item.productUuid,
            itemName: item.itemName,
            variantName: item.variantName,
            qty: (current?.qty ?? 0) + item.qty,
            kitchenNote: item.kitchenNote,
            modifierNames: item.modifierNames
          });
        } else if (item.lineAction === "update") {
          state.set(item.orderItemUuid, {
            orderItemUuid: item.orderItemUuid,
            productUuid: item.productUuid,
            itemName: item.itemName,
            variantName: item.variantName,
            qty: item.qty,
            kitchenNote: item.kitchenNote,
            modifierNames: item.modifierNames
          });
        } else if (current) {
          const nextQty = current.qty - item.qty;
          if (nextQty <= 0) {
            state.delete(item.orderItemUuid);
          } else {
            state.set(item.orderItemUuid, {
              ...current,
              qty: nextQty
            });
          }
        }
      }
    }

    return state;
  }
}

function mapCurrentOrderItem(row: OrderItemRow, modifiers: OrderItemModifierRow[]): KitchenStateItem {
  return {
    orderItemUuid: row.uuid,
    productUuid: row.product_uuid,
    itemName: row.product_name,
    variantName: row.variant_name,
    qty: row.qty,
    kitchenNote: row.kitchen_note,
    modifierNames: modifiers.map((modifier) => modifier.name)
  };
}

function toPersistItem(item: KitchenStateItem, qty: number, lineAction: PersistKotItemInput["lineAction"]): PersistKotItemInput {
  return {
    orderItemUuid: item.orderItemUuid,
    productUuid: item.productUuid,
    itemName: item.itemName,
    variantName: item.variantName,
    qty,
    lineAction,
    kitchenNote: item.kitchenNote,
    modifierSnapshotJson: JSON.stringify(item.modifierNames)
  };
}

function mapPersistedItemToContract(item: PersistKotItemInput): KotItem {
  return {
    uuid: "",
    orderItemUuid: item.orderItemUuid,
    productUuid: item.productUuid,
    itemName: item.itemName,
    variantName: item.variantName,
    qty: item.qty,
    lineAction: item.lineAction,
    kitchenNote: item.kitchenNote,
    modifierNames: JSON.parse(item.modifierSnapshotJson) as string[]
  };
}

export class KotError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}
