import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { productRefSchema, productSearchSchema } from "../../shared/schemas/catalog-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { CatalogError, CatalogService } from "../services/catalog-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";
import { sessionStore } from "../security/session-store";

export function registerCatalogIpc(db: Database.Database): void {
  const service = new CatalogService(db);

  ipcMain.handle(ipcChannels.catalogGetBootstrap, () => requireSession(() => ok(service.getBootstrap())));
  ipcMain.handle(ipcChannels.catalogListCategories, () => requireSession(() => ok(service.listCategories())));
  ipcMain.handle(ipcChannels.catalogSearchProducts, (_event, input: unknown) =>
    requireSession(() => {
      const payload = validateIpcInput(productSearchSchema, input);
      return ok(
        service.searchProducts({
          categoryUuid: payload.categoryUuid,
          query: payload.query,
          exactBarcode: payload.exactBarcode,
          offset: payload.offset ?? 0,
          limit: payload.limit ?? 60
        })
      );
    })
  );
  ipcMain.handle(ipcChannels.catalogGetProduct, (_event, input: unknown) =>
    requireSession(() => ok(service.getProduct(validateIpcInput(productRefSchema, input).productUuid)))
  );
}

function requireSession<T>(work: () => T) {
  if (!sessionStore.getSession()) {
    return fail("UNAUTHENTICATED", "Please log in to continue.");
  }

  try {
    return work();
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("INVALID_IPC_PAYLOAD", "Catalog request is invalid.");
  }
  if (error instanceof CatalogError) {
    return fail(error.code, error.message);
  }

  logger.error("ipc", "Catalog IPC failed", error);
  const safeError = toSafeError(error);
  return fail(safeError.code, safeError.message, safeError.details);
}
