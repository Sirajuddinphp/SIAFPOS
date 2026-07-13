import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import {
  addOrderItemSchema,
  applyOrderDiscountSchema,
  createOrderDraftSchema,
  orderRefSchema,
  removeOrderItemSchema,
  setOrderCustomerSchema,
  setOrderItemModifiersSchema,
  setOrderItemNoteSchema,
  setOrderItemVariantSchema,
  setOrderTableSchema,
  setOrderTypeSchema,
  setOrderWaiterSchema,
  updateOrderItemQuantitySchema
} from "../../shared/schemas/order-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { OrderError, OrderService } from "../services/order-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";

export function registerOrderIpc(db: Database.Database): void {
  const service = new OrderService(db);

  const withSession = <T>(work: (session: NonNullable<ReturnType<typeof sessionStore.getSession>>) => T) => {
    const session = sessionStore.getSession();
    if (!session) {
      return fail("UNAUTHENTICATED", "Please log in to continue.");
    }

    try {
      return work(session);
    } catch (error) {
      return handleError(error);
    }
  };

  ipcMain.handle(ipcChannels.ordersCreateDraft, (_event, input: unknown) =>
    withSession((session) =>
      ok(
        service.createDraft(validateIpcInput(createOrderDraftSchema, input).orderType, {
          userUuid: session.user.uuid,
          terminalUuid: session.terminal.uuid
        })
      )
    )
  );
  ipcMain.handle(ipcChannels.ordersGetDraft, (_event, input: unknown) =>
    withSession(() => ok(service.getDraft(validateIpcInput(orderRefSchema, input).orderUuid)))
  );
  ipcMain.handle(ipcChannels.ordersAddItem, (_event, input: unknown) =>
    withSession(() => ok(service.addItem(validateIpcInput(addOrderItemSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersUpdateItemQuantity, (_event, input: unknown) =>
    withSession(() => ok(service.updateItemQuantity(validateIpcInput(updateOrderItemQuantitySchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersRemoveItem, (_event, input: unknown) =>
    withSession(() => {
      const payload = validateIpcInput(removeOrderItemSchema, input);
      return ok(service.removeItem(payload.orderUuid, payload.orderItemUuid));
    })
  );
  ipcMain.handle(ipcChannels.ordersSetItemVariant, (_event, input: unknown) =>
    withSession(() => ok(service.setItemVariant(validateIpcInput(setOrderItemVariantSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersSetItemModifiers, (_event, input: unknown) =>
    withSession(() => ok(service.setItemModifiers(validateIpcInput(setOrderItemModifiersSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersSetItemNote, (_event, input: unknown) =>
    withSession(() => ok(service.setItemNote(validateIpcInput(setOrderItemNoteSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersSetCustomer, (_event, input: unknown) =>
    withSession(() => ok(service.setCustomer(validateIpcInput(setOrderCustomerSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersSetOrderType, (_event, input: unknown) =>
    withSession(() => ok(service.setOrderType(validateIpcInput(setOrderTypeSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersSetTable, (_event, input: unknown) =>
    withSession(() => ok(service.setTable(validateIpcInput(setOrderTableSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersSetWaiter, (_event, input: unknown) =>
    withSession(() => ok(service.setWaiter(validateIpcInput(setOrderWaiterSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersApplyDiscount, (_event, input: unknown) =>
    withSession(() => ok(service.applyDiscount(validateIpcInput(applyOrderDiscountSchema, input))))
  );
  ipcMain.handle(ipcChannels.ordersRemoveDiscount, (_event, input: unknown) =>
    withSession(() => ok(service.removeDiscount(validateIpcInput(orderRefSchema, input).orderUuid)))
  );
  ipcMain.handle(ipcChannels.ordersHold, (_event, input: unknown) =>
    withSession((session) => ok(service.hold(validateIpcInput(orderRefSchema, input).orderUuid, session.user.uuid)))
  );
  ipcMain.handle(ipcChannels.ordersListHeld, () => withSession(() => ok(service.listHeld())));
  ipcMain.handle(ipcChannels.ordersRecallHeld, (_event, input: unknown) =>
    withSession(() => ok(service.recall(validateIpcInput(orderRefSchema, input).orderUuid)))
  );
  ipcMain.handle(ipcChannels.ordersListRunning, () => withSession(() => ok(service.listRunning())));
  ipcMain.handle(ipcChannels.ordersGetSummary, (_event, input: unknown) =>
    withSession(() => ok(service.getDraft(validateIpcInput(orderRefSchema, input).orderUuid)))
  );
}

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("INVALID_IPC_PAYLOAD", "Order request is invalid.");
  }
  if (error instanceof OrderError) {
    return fail(error.code, error.message);
  }

  logger.error("ipc", "Order IPC failed", error);
  const safeError = toSafeError(error);
  return fail(safeError.code, safeError.message, safeError.details);
}
