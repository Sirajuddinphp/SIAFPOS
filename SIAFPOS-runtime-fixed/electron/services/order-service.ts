import type Database from "better-sqlite3";
import type {
  AddOrderItemInput,
  ApplyOrderDiscountInput,
  OrderDraft,
  OrderItemDraft,
  OrderStatus,
  OrderType,
  RunningOrderSummary,
  SetOrderCustomerInput,
  SetOrderItemModifiersInput,
  SetOrderItemNoteInput,
  SetOrderItemVariantInput,
  SetOrderTableInput,
  SetOrderTypeInput,
  SetOrderWaiterInput,
  UpdateOrderItemQuantityInput
} from "../../shared/contracts/order-contracts";
import { CustomerRepository } from "../repositories/customer-repository";
import { HeldOrderRepository } from "../repositories/held-order-repository";
import { ModifierGroupRepository } from "../repositories/modifier-group-repository";
import { OrderRepository, type OrderHeaderRow, type OrderItemModifierRow, type OrderItemRow } from "../repositories/order-repository";
import { ProductRepository } from "../repositories/product-repository";
import { ProductVariantRepository } from "../repositories/product-variant-repository";
import { TableRepository } from "../repositories/table-repository";
import { WaiterRepository } from "../repositories/waiter-repository";
import { PricingService } from "./pricing-service";

export class OrderService {
  private readonly orders: OrderRepository;
  private readonly heldOrders: HeldOrderRepository;
  private readonly products: ProductRepository;
  private readonly variants: ProductVariantRepository;
  private readonly modifierGroups: ModifierGroupRepository;
  private readonly customers: CustomerRepository;
  private readonly tables: TableRepository;
  private readonly waiters: WaiterRepository;
  private readonly pricing: PricingService;

  constructor(private readonly db: Database.Database) {
    this.orders = new OrderRepository(db);
    this.heldOrders = new HeldOrderRepository(db);
    this.products = new ProductRepository(db);
    this.variants = new ProductVariantRepository(db);
    this.modifierGroups = new ModifierGroupRepository(db);
    this.customers = new CustomerRepository(db);
    this.tables = new TableRepository(db);
    this.waiters = new WaiterRepository(db);
    this.pricing = new PricingService();
  }

  createDraft(orderType: OrderType, context: { userUuid: string; terminalUuid: string }): OrderDraft {
    const now = new Date().toISOString();
    const order = this.orders.createDraft(orderType, context.userUuid, context.terminalUuid, now);
    return this.buildDraft(order.uuid)!;
  }

  getDraft(orderUuid: string): OrderDraft {
    const draft = this.buildDraft(orderUuid);
    if (!draft) {
      throw new OrderError("NOT_FOUND", "Order not found.");
    }
    return draft;
  }

  addItem(input: AddOrderItemInput): OrderDraft {
    const product = this.products.getProduct(input.productUuid);
    if (!product) {
      throw new OrderError("NOT_FOUND", "Product not found.");
    }
    const variant = input.variantUuid
      ? this.variants.findByUuid(input.variantUuid)
      : product.variants.find((variantOption) => variantOption.isDefault) ?? null;
    const now = new Date().toISOString();

    this.orders.addItem({
      orderUuid: input.orderUuid,
      productUuid: product.uuid,
      productName: product.name,
      variantUuid: variant?.uuid ?? null,
      variantName: variant?.name ?? null,
      qty: 1,
      unitPriceMinor: variant?.priceMinor ?? product.basePriceMinor,
      gstMode: product.gstMode,
      gstRateBasisPoints: product.gstRateBasisPoints,
      now
    });

    return this.recalculateAndBuild(input.orderUuid);
  }

  updateItemQuantity(input: UpdateOrderItemQuantityInput): OrderDraft {
    const item = this.requireItem(input.orderUuid, input.orderItemUuid);
    if (input.quantity <= 0) {
      this.orders.removeItem(item.uuid);
      return this.recalculateAndBuild(input.orderUuid);
    }

    this.orders.updateItemQuantity(item.uuid, input.quantity, new Date().toISOString());
    return this.recalculateAndBuild(input.orderUuid);
  }

  removeItem(orderUuid: string, orderItemUuid: string): OrderDraft {
    this.requireItem(orderUuid, orderItemUuid);
    this.orders.removeItem(orderItemUuid);
    return this.recalculateAndBuild(orderUuid);
  }

  setItemVariant(input: SetOrderItemVariantInput): OrderDraft {
    const item = this.requireItem(input.orderUuid, input.orderItemUuid);
    const variant = this.variants.findByUuid(input.variantUuid);
    if (!variant || variant.productUuid !== item.product_uuid) {
      throw new OrderError("NOT_FOUND", "Variant not found.");
    }

    this.orders.updateItemVariant(item.uuid, variant.uuid, variant.name, variant.priceMinor, new Date().toISOString());
    return this.recalculateAndBuild(input.orderUuid);
  }

  setItemModifiers(input: SetOrderItemModifiersInput): OrderDraft {
    const item = this.requireItem(input.orderUuid, input.orderItemUuid);
    const groups = this.modifierGroups.listByProduct(item.product_uuid);
    const options = groups.flatMap((group) => group.modifiers);
    const selected = input.modifierUuids.map((modifierUuid) => {
      const modifier = options.find((option) => option.uuid === modifierUuid);
      if (!modifier) {
        throw new OrderError("NOT_FOUND", "Modifier not found.");
      }
      return modifier;
    });

    for (const group of groups) {
      const count = selected.filter((modifier) => modifier.groupUuid === group.uuid).length;
      if (count < group.minSelect) {
        throw new OrderError("INVALID_STATE", `${group.name} requires at least ${group.minSelect} selection(s).`);
      }
      if (count > group.maxSelect) {
        throw new OrderError("INVALID_STATE", `${group.name} allows at most ${group.maxSelect} selection(s).`);
      }
    }

    this.orders.replaceItemModifiers(
      item.uuid,
      selected.map((modifier) => ({
        modifierUuid: modifier.uuid,
        groupUuid: modifier.groupUuid,
        name: modifier.name,
        priceDeltaMinor: modifier.priceDeltaMinor
      })),
      new Date().toISOString()
    );

    return this.recalculateAndBuild(input.orderUuid);
  }

  setItemNote(input: SetOrderItemNoteInput): OrderDraft {
    this.requireItem(input.orderUuid, input.orderItemUuid);
    this.orders.updateItemNote(input.orderItemUuid, input.kitchenNote || null, new Date().toISOString());
    return this.recalculateAndBuild(input.orderUuid);
  }

  setCustomer(input: SetOrderCustomerInput): OrderDraft {
    if (input.customerUuid) {
      const customer = this.customers.findByUuid(input.customerUuid);
      if (!customer) {
        throw new OrderError("NOT_FOUND", "Customer not found.");
      }
    }

    this.orders.setCustomer(input.orderUuid, input.customerUuid, new Date().toISOString());
    return this.recalculateAndBuild(input.orderUuid);
  }

  setOrderType(input: SetOrderTypeInput): OrderDraft {
    this.orders.setOrderType(input.orderUuid, input.orderType, new Date().toISOString());
    return this.recalculateAndBuild(input.orderUuid);
  }

  setTable(input: SetOrderTableInput): OrderDraft {
    if (input.tableUuid) {
      const table = this.tables.findByUuid(input.tableUuid);
      if (!table) {
        throw new OrderError("NOT_FOUND", "Table not found.");
      }
    }

    this.orders.setTable(input.orderUuid, input.tableUuid, new Date().toISOString());
    return this.recalculateAndBuild(input.orderUuid);
  }

  setWaiter(input: SetOrderWaiterInput): OrderDraft {
    if (input.waiterUuid) {
      const waiter = this.waiters.findByUuid(input.waiterUuid);
      if (!waiter) {
        throw new OrderError("NOT_FOUND", "Waiter not found.");
      }
    }

    this.orders.setWaiter(input.orderUuid, input.waiterUuid, new Date().toISOString());
    return this.recalculateAndBuild(input.orderUuid);
  }

  applyDiscount(input: ApplyOrderDiscountInput): OrderDraft {
    const draft = this.getDraft(input.orderUuid);
    if (input.type === "percentage" && input.value > 100) {
      throw new OrderError("INVALID_STATE", "Percentage discount cannot exceed 100.");
    }
    if (input.type === "fixed" && input.value > draft.totals.subtotalMinor) {
      throw new OrderError("DISCOUNT_EXCEEDS_SUBTOTAL", "Fixed discount exceeds subtotal.");
    }

    this.orders.setDiscount(
      input.orderUuid,
      {
        type: input.type,
        value: input.value,
        amountMinor: 0
      },
      new Date().toISOString()
    );
    return this.recalculateAndBuild(input.orderUuid);
  }

  removeDiscount(orderUuid: string): OrderDraft {
    this.orders.setDiscount(orderUuid, null, new Date().toISOString());
    return this.recalculateAndBuild(orderUuid);
  }

  hold(orderUuid: string, userUuid: string): OrderDraft {
    const header = this.requireOrderHeader(orderUuid);
    this.assertOrderCanBeHeld(header);
    const now = new Date().toISOString();
    this.orders.hold(orderUuid, userUuid, now);
    return this.recalculateAndBuild(orderUuid, "held", now);
  }

  recall(orderUuid: string): OrderDraft {
    this.requireOrderHeader(orderUuid);
    this.orders.recall(orderUuid);
    return this.recalculateAndBuild(orderUuid, "active", null);
  }

  listHeld() {
    return this.heldOrders.listHeld();
  }

  listRunning(): RunningOrderSummary[] {
    return this.orders.listRunning();
  }

  private recalculateAndBuild(orderUuid: string, forcedStatus?: OrderStatus, heldAt?: string | null): OrderDraft {
    const header = this.requireOrderHeader(orderUuid);
    const items = this.orders.listItems(orderUuid);
    const modifiers = this.orders.listItemModifiers(items.map((item) => item.uuid));
    const appliedDiscount = header.discount_type
      ? { type: header.discount_type, value: header.discount_value ?? 0 }
      : null;

    const totals = this.pricing.computeOrderTotals(
      items.map((item) => ({
        unitPriceMinor: item.unit_price_minor,
        qty: item.qty,
        gstMode: item.gst_mode,
        gstRateBasisPoints: item.gst_rate_basis_points,
        modifierTotalMinor: modifiers.filter((modifier) => modifier.order_item_uuid === item.uuid).reduce((sum, modifier) => sum + modifier.price_delta_minor, 0)
      })),
      appliedDiscount
    );

    this.orders.setDiscount(
      orderUuid,
      appliedDiscount
        ? {
            type: appliedDiscount.type,
            value: appliedDiscount.value,
            amountMinor: totals.discountMinor
          }
        : null,
      new Date().toISOString()
    );

    this.orders.updateTotals(
      orderUuid,
      forcedStatus ?? this.resolveStatus(header, items),
      {
        subtotalMinor: totals.subtotalMinor,
        taxableMinor: totals.taxableMinor,
        taxMinor: totals.taxMinor,
        grandTotalMinor: totals.grandTotalMinor
      },
      heldAt ?? header.held_at,
      new Date().toISOString()
    );

    return this.getDraft(orderUuid);
  }

  private buildDraft(orderUuid: string): OrderDraft | null {
    const header = this.orders.getHeader(orderUuid);
    if (!header) {
      return null;
    }

    const itemRows = this.orders.listItems(orderUuid);
    const modifierRows = this.orders.listItemModifiers(itemRows.map((item) => item.uuid));
    const lineComputations = this.pricing.computeOrderItems(
      itemRows.map((item) => ({
        unitPriceMinor: item.unit_price_minor,
        qty: item.qty,
        gstMode: item.gst_mode,
        gstRateBasisPoints: item.gst_rate_basis_points,
        modifierTotalMinor: modifierRows.filter((modifier) => modifier.order_item_uuid === item.uuid).reduce((sum, modifier) => sum + modifier.price_delta_minor, 0)
      })),
      header.discount_type ? { type: header.discount_type, value: header.discount_value ?? 0 } : null
    );

    const items: OrderItemDraft[] = itemRows.map((row, index) =>
      this.mapOrderItem(row, modifierRows.filter((modifier) => modifier.order_item_uuid === row.uuid), lineComputations[index])
    );

    return {
      uuid: header.uuid,
      orderNo: header.order_no,
      orderType: header.order_type,
      status: header.status,
      customer: header.customer_uuid ? this.customers.findByUuid(header.customer_uuid) : null,
      table: header.table_uuid ? this.tables.findByUuid(header.table_uuid) : null,
      waiter: header.waiter_uuid ? this.waiters.findByUuid(header.waiter_uuid) : null,
      discount: header.discount_type
        ? {
            type: header.discount_type,
            value: header.discount_value ?? 0,
            amountMinor: header.discount_amount_minor
          }
        : null,
      items,
      totals: {
        subtotalMinor: header.subtotal_minor,
        discountMinor: header.discount_amount_minor,
        taxableMinor: header.taxable_minor,
        taxMinor: header.tax_minor,
        grandTotalMinor: header.grand_total_minor
      },
      updatedAt: header.updated_at
    };
  }

  private mapOrderItem(
    row: OrderItemRow,
    modifiers: OrderItemModifierRow[],
    totals: Pick<OrderItemDraft, "lineSubtotalMinor" | "lineDiscountMinor" | "lineTaxMinor" | "lineGrandTotalMinor">
  ): OrderItemDraft {
    return {
      uuid: row.uuid,
      productUuid: row.product_uuid,
      productName: row.product_name,
      variantUuid: row.variant_uuid,
      variantName: row.variant_name,
      qty: row.qty,
      unitPriceMinor: row.unit_price_minor,
      gstMode: row.gst_mode,
      gstRateBasisPoints: row.gst_rate_basis_points,
      kitchenNote: row.kitchen_note,
      modifiers: modifiers.map((modifier) => ({
        uuid: modifier.uuid,
        modifierUuid: modifier.modifier_uuid,
        groupUuid: modifier.modifier_group_uuid,
        name: modifier.name,
        priceDeltaMinor: modifier.price_delta_minor
      })),
      availableVariants: this.variants.listByProduct(row.product_uuid),
      availableModifierGroups: this.modifierGroups.listByProduct(row.product_uuid),
      ...totals
    };
  }

  private resolveStatus(header: OrderHeaderRow, items: OrderItemRow[]): OrderStatus {
    if (header.status === "held") {
      return "held";
    }
    return items.length > 0 ? "active" : "draft";
  }

  private assertOrderCanBeHeld(header: OrderHeaderRow): void {
    if (header.order_type === "dine_in") {
      if (!header.table_uuid) {
        throw new OrderError("TABLE_REQUIRED", "Dine-in orders require a table before hold.");
      }
      if (!header.waiter_uuid) {
        throw new OrderError("WAITER_REQUIRED", "Dine-in orders require a waiter before hold.");
      }
    }
  }

  private requireOrderHeader(orderUuid: string): OrderHeaderRow {
    const header = this.orders.getHeader(orderUuid);
    if (!header) {
      throw new OrderError("NOT_FOUND", "Order not found.");
    }
    return header;
  }

  private requireItem(orderUuid: string, orderItemUuid: string): OrderItemRow {
    const item = this.orders.listItems(orderUuid).find((row) => row.uuid === orderItemUuid);
    if (!item) {
      throw new OrderError("NOT_FOUND", "Order item not found.");
    }
    return item;
  }
}

export class OrderError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}
