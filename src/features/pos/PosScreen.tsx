import type { ReactNode } from "react";
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List, type ListChildComponentProps } from "react-window";
import type { CustomerSummary } from "@shared/contracts/customer-contracts";
import type { KotPreview } from "@shared/contracts/kot-contracts";
import type { ProductSummary } from "@shared/contracts/catalog-contracts";
import type { OrderItemDraft, OrderType } from "@shared/contracts/order-contracts";
import { Button } from "../../components/ui/Button";
import { useCatalogStore } from "../../stores/catalog-store";
import { useCustomerStore } from "../../stores/customer-store";
import { useKotStore } from "../../stores/kot-store";
import { usePosStore } from "../../stores/pos-store";
import { useTableStore } from "../../stores/table-store";
import { formatCurrency } from "../../utils/money";

const PRODUCT_CARD_WIDTH = 188;
const PRODUCT_CARD_HEIGHT = 116;
const PRODUCT_GRID_HEIGHT = 480;

type ProductRowData = {
  rows: ProductSummary[][];
  addProduct: (productUuid: string, variantUuid?: string) => Promise<void>;
};

export function PosScreen() {
  const {
    categories,
    results,
    selectedCategoryUuid,
    searchQuery,
    loadBootstrap,
    searchProducts,
    setSearchQuery,
    setSelectedCategory,
    loading: catalogLoading,
    error: catalogError
  } = useCatalogStore();
  const {
    currentOrder,
    selectedItemUuid,
    ensureOrder,
    addProduct,
    updateQuantity,
    removeItem,
    setItemVariant,
    setItemModifiers,
    setItemNote,
    setCustomer,
    setOrderType,
    setTable,
    setWaiter,
    applyDiscount,
    removeDiscount,
    hold,
    setSelectedItemUuid,
    error: orderError,
    loading: orderLoading
  } = usePosStore();
  const { customers, loadRecent, search: searchCustomers } = useCustomerStore();
  const { floorMap, waiters, refresh: refreshTables } = useTableStore();
  const { orderTickets, preview, loadPreview, loadOrderTickets, createKot, clearPreview, loading: kotLoading, error: kotError } = useKotStore();

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const productPaneRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showWaiterPicker, setShowWaiterPicker] = useState(false);
  const [showKotModal, setShowKotModal] = useState(false);
  const [editingModifiersFor, setEditingModifiersFor] = useState<OrderItemDraft | null>(null);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([loadBootstrap(), ensureOrder("takeaway"), refreshTables(), loadRecent()]);
  }, [ensureOrder, loadBootstrap, loadRecent, refreshTables]);

  useEffect(() => {
    if (!activeFloor && floorMap?.floors[0]) {
      setActiveFloor(floorMap.floors[0]);
    }
  }, [activeFloor, floorMap]);

  useEffect(() => {
    if (currentOrder?.uuid) {
      void loadOrderTickets(currentOrder.uuid);
    }
  }, [currentOrder?.uuid, loadOrderTickets]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchProducts({ query: searchQuery, categoryUuid: selectedCategoryUuid, offset: 0 });
    }, barcodeMode ? 0 : 120);
    return () => window.clearTimeout(timer);
  }, [barcodeMode, searchProducts, searchQuery, selectedCategoryUuid]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "F3") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "F6") {
        event.preventDefault();
        void hold();
      }

      if (!selectedItemUuid || !currentOrder) {
        return;
      }

      const item = currentOrder.items.find((entry) => entry.uuid === selectedItemUuid);
      if (!item) {
        return;
      }

      if (event.key === "Delete") {
        event.preventDefault();
        void removeItem(selectedItemUuid);
      }

      if (event.key === "+") {
        event.preventDefault();
        void updateQuantity(selectedItemUuid, item.qty + 1);
      }

      if (event.key === "-") {
        event.preventDefault();
        void updateQuantity(selectedItemUuid, item.qty - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentOrder, hold, removeItem, selectedItemUuid, updateQuantity]);

  useLayoutEffect(() => {
    const element = productPaneRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 600);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const selectedOrderType = currentOrder?.orderType ?? "takeaway";
  const selectedItem = currentOrder?.items.find((item) => item.uuid === selectedItemUuid) ?? currentOrder?.items[0] ?? null;
  const latestKot = orderTickets[0] ?? null;
  const columnCount = Math.max(2, Math.floor((containerWidth - 20) / PRODUCT_CARD_WIDTH));
  const productRows = chunkProducts(results.items, columnCount);
  const visibleTables = floorMap?.tables.filter((table) => table.floor === activeFloor) ?? [];

  const listData = useMemo<ProductRowData>(
    () => ({
      rows: productRows,
      addProduct
    }),
    [addProduct, productRows]
  );

  return (
    <div className="grid h-full min-h-0 grid-cols-[200px_minmax(0,1fr)_380px] gap-3">
      <section className="flex min-h-0 flex-col rounded-lg border border-app-border bg-white">
        <div className="border-b border-app-border p-3">
          <div className="text-sm font-extrabold uppercase text-app-subtle">Order Type</div>
          <div className="mt-2 grid gap-2">
            {(["dine_in", "takeaway", "delivery"] as OrderType[]).map((orderType) => (
              <button
                key={orderType}
                className={`h-11 rounded-md px-3 text-left text-sm font-semibold ${
                  selectedOrderType === orderType ? "bg-app-primary text-white" : "bg-app-muted text-app-text"
                }`}
                onClick={() => void setOrderType(orderType)}
              >
                {labelOrderType(orderType)}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="mb-2 text-sm font-extrabold uppercase text-app-subtle">Categories</div>
          <div className="space-y-2">
            <button
              className={`w-full rounded-md px-3 py-3 text-left text-sm font-semibold ${
                !selectedCategoryUuid ? "bg-app-primary text-white" : "bg-app-muted text-app-text"
              }`}
              onClick={() => {
                setSelectedCategory(undefined);
                void searchProducts({ categoryUuid: undefined, offset: 0 });
              }}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.uuid}
                className={`w-full rounded-md px-3 py-3 text-left text-sm font-semibold ${
                  selectedCategoryUuid === category.uuid ? "bg-app-primary text-white" : "bg-app-muted text-app-text"
                }`}
                onClick={() => {
                  setSelectedCategory(category.uuid);
                  void searchProducts({ categoryUuid: category.uuid, offset: 0 });
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-col rounded-lg border border-app-border bg-white">
        <div className="border-b border-app-border p-3">
          <div className="flex items-center gap-2">
            <input
              ref={searchInputRef}
              className="h-11 flex-1 rounded-md border border-app-border px-3 text-sm outline-none focus:border-app-primary"
              value={searchQuery}
              placeholder={barcodeMode ? "Scan exact barcode" : "Search by product, SKU, barcode"}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (barcodeMode && event.key === "Enter" && event.currentTarget.value.trim()) {
                  event.preventDefault();
                  void searchProducts({ exactBarcode: event.currentTarget.value.trim(), offset: 0 });
                }
              }}
            />
            <Button variant={barcodeMode ? "primary" : "secondary"} className="h-11 px-3" onClick={() => setBarcodeMode((value) => !value)}>
              Barcode
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-app-subtle">
            <span>{results.total} products</span>
            <span>F3 search • F6 hold • Delete remove</span>
          </div>
        </div>
        <div ref={productPaneRef} className="min-h-0 flex-1 p-3">
          {catalogError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{catalogError}</div>
          ) : results.items.length === 0 && !catalogLoading ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-app-border bg-app-bg text-sm text-app-subtle">
              No products match this view.
            </div>
          ) : (
            <List height={PRODUCT_GRID_HEIGHT} itemCount={productRows.length} itemSize={PRODUCT_CARD_HEIGHT + 12} width="100%" itemData={listData}>
              {ProductRow}
            </List>
          )}
        </div>
      </section>

      <section className="flex min-h-0 flex-col rounded-lg border border-app-border bg-white">
        <div className="border-b border-app-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-extrabold">Current Order</div>
              <div className="text-xs text-app-subtle">{currentOrder?.orderNo ?? "Draft"}</div>
            </div>
            <Button variant="secondary" className="h-10 px-3" onClick={() => void ensureOrder(selectedOrderType)}>
              New Draft
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <ContextChip label="Customer" value={currentOrder?.customer?.name ?? "Select"} onClick={() => setShowCustomerPicker(true)} />
            <ContextChip label="Table" value={currentOrder?.table?.name ?? "Select"} onClick={() => setShowTablePicker(true)} />
            <ContextChip label="Waiter" value={currentOrder?.waiter?.name ?? "Select"} onClick={() => setShowWaiterPicker(true)} />
            <ContextChip label="Status" value={currentOrder?.status ?? "draft"} />
            <ContextChip label="Latest KOT" value={latestKot ? `${latestKot.kind} • ${latestKot.status}` : "Not sent"} />
            <ContextChip label="KOT Count" value={String(orderTickets.length)} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="space-y-2">
            {currentOrder?.items.length ? (
              currentOrder.items.map((item) => (
                <button
                  key={item.uuid}
                  className={`w-full rounded-md border p-3 text-left ${
                    selectedItemUuid === item.uuid ? "border-app-primary bg-[#eef7f5]" : "border-app-border bg-app-bg"
                  }`}
                  onClick={() => {
                    setSelectedItemUuid(item.uuid);
                    setNoteDraft(item.kitchenNote ?? "");
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">
                        {item.productName}
                        {item.variantName ? ` • ${item.variantName}` : ""}
                      </div>
                      <div className="mt-1 text-xs text-app-subtle">
                        {item.modifiers.map((modifier) => modifier.name).join(", ") || "No add-ons"}
                      </div>
                      {item.kitchenNote && <div className="mt-1 text-xs text-app-info">Note: {item.kitchenNote}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatCurrency(item.lineGrandTotalMinor)}</div>
                      <div className="text-xs text-app-subtle">GST {item.gstMode}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" className="h-9 px-3" onClick={(event) => { event.stopPropagation(); void updateQuantity(item.uuid, item.qty - 1); }}>-</Button>
                      <span className="min-w-8 text-center text-sm font-bold">{item.qty}</span>
                      <Button variant="secondary" className="h-9 px-3" onClick={(event) => { event.stopPropagation(); void updateQuantity(item.uuid, item.qty + 1); }}>+</Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="h-9 px-3" onClick={(event) => { event.stopPropagation(); setEditingModifiersFor(item); }}>
                        Configure
                      </Button>
                      <Button variant="danger" className="h-9 px-3" onClick={(event) => { event.stopPropagation(); void removeItem(item.uuid); }}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-app-border bg-app-bg p-6 text-center text-sm text-app-subtle">
                Add products to start the order.
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="mt-3 rounded-md border border-app-border bg-white p-3">
              <div className="mb-2 text-xs font-extrabold uppercase text-app-subtle">Selected Item</div>
              {selectedItem.availableVariants.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 text-xs font-semibold text-app-subtle">Variant</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.availableVariants.map((variant) => (
                      <button
                        key={variant.uuid}
                        className={`rounded-md px-3 py-2 text-sm font-semibold ${
                          selectedItem.variantUuid === variant.uuid ? "bg-app-primary text-white" : "bg-app-muted text-app-text"
                        }`}
                        onClick={() => void setItemVariant(selectedItem.uuid, variant.uuid)}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-app-subtle">Kitchen Note</span>
                <textarea
                  className="h-20 w-full rounded-md border border-app-border px-3 py-2 text-sm outline-none focus:border-app-primary"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                />
              </label>
              <div className="mt-2 flex justify-end">
                <Button variant="secondary" className="h-10 px-3" onClick={() => void setItemNote(selectedItem.uuid, noteDraft)}>
                  Save Note
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-app-border p-3">
          <div className="mb-2 flex gap-2">
            <select
              className="h-10 flex-1 rounded-md border border-app-border px-3 text-sm"
              value={discountType}
              onChange={(event) => setDiscountType(event.target.value as "fixed" | "percentage")}
            >
              <option value="fixed">Fixed discount</option>
              <option value="percentage">Percentage discount</option>
            </select>
            <input
              className="h-10 w-28 rounded-md border border-app-border px-3 text-sm"
              value={discountValue}
              placeholder={discountType === "fixed" ? "Amount" : "%"}
              onChange={(event) => setDiscountValue(event.target.value)}
            />
            <Button variant="secondary" className="h-10 px-3" onClick={() => void applyDiscount(discountType, Number(discountValue || "0"))}>
              Apply
            </Button>
          </div>
          <div className="space-y-1 text-sm">
            <TotalsRow label="Subtotal" value={currentOrder?.totals.subtotalMinor ?? 0} />
            <TotalsRow label="Discount" value={currentOrder?.totals.discountMinor ?? 0} danger />
            <TotalsRow label="GST" value={currentOrder?.totals.taxMinor ?? 0} />
            <TotalsRow label="Grand Total" value={currentOrder?.totals.grandTotalMinor ?? 0} strong />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button variant="secondary" className="h-11 px-3" onClick={() => void removeDiscount()}>
              Clear Disc
            </Button>
            <Button variant="secondary" className="h-11 px-3" onClick={() => void hold()}>
              Hold
            </Button>
            <Button
              variant="primary"
              className="h-11 px-3"
              onClick={async () => {
                if (!currentOrder) {
                  return;
                }
                const nextPreview = await loadPreview(currentOrder.uuid);
                if (nextPreview) {
                  setShowKotModal(true);
                }
              }}
            >
              Send KOT
            </Button>
          </div>
          {(orderError || catalogError || kotError) && <div className="mt-3 text-sm text-red-700">{orderError ?? catalogError ?? kotError}</div>}
          {(orderLoading || catalogLoading || kotLoading) && <div className="mt-2 text-xs text-app-subtle">Updating order...</div>}
        </div>
      </section>

      {showCustomerPicker && (
        <PickerModal title="Select Customer" onClose={() => setShowCustomerPicker(false)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void searchCustomers(customerQuery);
            }}
            className="mb-3 flex gap-2"
          >
            <input
              className="h-10 flex-1 rounded-md border border-app-border px-3 text-sm"
              placeholder="Search customer"
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
            />
            <Button type="submit" variant="secondary" className="h-10 px-3">
              Search
            </Button>
          </form>
          <div className="space-y-2">
            <button
              className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-left text-sm"
              onClick={() => {
                void setCustomer(null);
                setShowCustomerPicker(false);
              }}
            >
              Walk-in customer
            </button>
            {customers.map((customer) => (
              <CustomerOption
                key={customer.uuid}
                customer={customer}
                onPick={() => {
                  void setCustomer(customer.uuid);
                  setShowCustomerPicker(false);
                }}
              />
            ))}
          </div>
        </PickerModal>
      )}

      {showTablePicker && (
        <PickerModal title="Select Table" onClose={() => setShowTablePicker(false)}>
          <div className="mb-3 flex flex-wrap gap-2">
            {floorMap?.floors.map((floor) => (
              <button
                key={floor}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  activeFloor === floor ? "bg-app-primary text-white" : "bg-app-muted text-app-text"
                }`}
                onClick={() => setActiveFloor(floor)}
              >
                {floor}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {visibleTables.map((table) => (
              <button
                key={table.uuid}
                className={`rounded-md border px-3 py-4 text-left ${
                  currentOrder?.table?.uuid === table.uuid ? "border-app-primary bg-[#eef7f5]" : "border-app-border bg-app-bg"
                }`}
                onClick={() => {
                  void setTable(table.uuid);
                  setShowTablePicker(false);
                }}
              >
                <div className="text-sm font-bold">{table.name}</div>
                <div className="text-xs text-app-subtle">{table.capacity} seats</div>
              </button>
            ))}
          </div>
        </PickerModal>
      )}

      {showWaiterPicker && (
        <PickerModal title="Select Waiter" onClose={() => setShowWaiterPicker(false)}>
          <div className="space-y-2">
            {waiters.map((waiter) => (
              <button
                key={waiter.uuid}
                className={`w-full rounded-md border px-3 py-3 text-left ${
                  currentOrder?.waiter?.uuid === waiter.uuid ? "border-app-primary bg-[#eef7f5]" : "border-app-border bg-app-bg"
                }`}
                onClick={() => {
                  void setWaiter(waiter.uuid);
                  setShowWaiterPicker(false);
                }}
              >
                <div className="text-sm font-bold">{waiter.name}</div>
                <div className="text-xs text-app-subtle">{waiter.code}</div>
              </button>
            ))}
          </div>
        </PickerModal>
      )}

      {editingModifiersFor && (
        <ModifierEditor
          item={editingModifiersFor}
          onClose={() => setEditingModifiersFor(null)}
          onSave={(modifierUuids) => {
            void setItemModifiers(editingModifiersFor.uuid, modifierUuids);
            setEditingModifiersFor(null);
          }}
        />
      )}

      {showKotModal && currentOrder && preview && (
        <KotPreviewModal
          currentOrder={currentOrder}
          preview={preview}
          onClose={() => {
            setShowKotModal(false);
            clearPreview();
          }}
          onConfirm={async () => {
            const created = await createKot(currentOrder.uuid);
            if (created) {
              setShowKotModal(false);
            }
          }}
        />
      )}
    </div>
  );
}

function ProductRow({ index, style, data }: ListChildComponentProps<ProductRowData>) {
  const row = data.rows[index];
  return (
    <div style={style} className="flex gap-3">
      {row.map((product) => (
        <button
          key={product.uuid}
          className="flex h-[116px] w-[188px] flex-col justify-between rounded-md border border-app-border bg-app-bg p-3 text-left hover:border-app-primary"
          onClick={() => void data.addProduct(product.uuid)}
        >
          <div>
            <div className="line-clamp-2 text-sm font-bold">{product.name}</div>
            <div className="mt-1 text-xs text-app-subtle">
              {product.sku ?? "Open item"} {product.barcode ? `• ${product.barcode}` : ""}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold">{formatCurrency(product.basePriceMinor)}</span>
            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold uppercase text-app-subtle">{product.gstMode}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function ContextChip({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const body = (
    <>
      <div className="text-[11px] font-bold uppercase text-app-subtle">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </>
  );

  if (!onClick) {
    return <div className="rounded-md border border-app-border bg-app-bg px-3 py-2">{body}</div>;
  }

  return (
    <button className="rounded-md border border-app-border bg-app-bg px-3 py-2 text-left" onClick={onClick}>
      {body}
    </button>
  );
}

function TotalsRow({ label, value, strong = false, danger = false }: { label: string; value: number; strong?: boolean; danger?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-extrabold" : "text-sm"} ${danger ? "text-app-danger" : ""}`}>
      <span>{label}</span>
      <span className="tabular">{formatCurrency(value)}</span>
    </div>
  );
}

function PickerModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(23,32,42,0.28)] p-6">
      <div className="w-[620px] max-w-full rounded-lg border border-app-border bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-extrabold">{title}</div>
          <Button variant="ghost" className="h-10 px-3" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[560px] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function CustomerOption({ customer, onPick }: { customer: CustomerSummary; onPick: () => void }) {
  return (
    <button className="w-full rounded-md border border-app-border bg-app-bg px-3 py-3 text-left" onClick={onPick}>
      <div className="text-sm font-bold">{customer.name}</div>
      <div className="text-xs text-app-subtle">
        {customer.phone ?? "-"} • {customer.addressSummary ?? "No address"}
      </div>
    </button>
  );
}

function ModifierEditor({ item, onClose, onSave }: { item: OrderItemDraft; onClose: () => void; onSave: (modifierUuids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(item.modifiers.map((modifier) => modifier.modifierUuid));

  return (
    <PickerModal title={`Configure ${item.productName}`} onClose={onClose}>
      <div className="space-y-4">
        {item.availableModifierGroups.map((group) => (
          <div key={group.uuid}>
            <div className="mb-2 text-sm font-bold">{group.name}</div>
            <div className="grid grid-cols-2 gap-2">
              {group.modifiers.map((modifier) => {
                const active = selected.includes(modifier.uuid);
                return (
                  <button
                    key={modifier.uuid}
                    className={`rounded-md border px-3 py-3 text-left ${
                      active ? "border-app-primary bg-[#eef7f5]" : "border-app-border bg-app-bg"
                    }`}
                    onClick={() =>
                      setSelected((current) =>
                        current.includes(modifier.uuid)
                          ? current.filter((uuid) => uuid !== modifier.uuid)
                          : [...current, modifier.uuid]
                      )
                    }
                  >
                    <div className="text-sm font-bold">{modifier.name}</div>
                    <div className="text-xs text-app-subtle">{formatCurrency(modifier.priceDeltaMinor)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" className="h-10 px-3" onClick={onClose}>
            Cancel
          </Button>
          <Button className="h-10 px-3" onClick={() => onSave(selected)}>
            Save
          </Button>
        </div>
      </div>
    </PickerModal>
  );
}

function KotPreviewModal({
  currentOrder,
  preview,
  onClose,
  onConfirm
}: {
  currentOrder: { table: { name: string } | null; waiter: { name: string } | null };
  preview: KotPreview;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <PickerModal title={`Send KOT • ${preview.ticketKind}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-md border border-app-border bg-app-bg p-3">
          <div className="text-sm font-bold">{preview.orderNo}</div>
          <div className="mt-1 text-xs text-app-subtle">
            {labelOrderType(preview.orderType)} • {currentOrder.table?.name ?? "No table"} • {currentOrder.waiter?.name ?? "No waiter"}
          </div>
        </div>
        <div className="space-y-2">
          {preview.items.map((item, index) => (
            <div key={`${item.orderItemUuid}-${item.lineAction}-${index}`} className="rounded-md border border-app-border bg-app-bg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">
                  {item.itemName}
                  {item.variantName ? ` • ${item.variantName}` : ""}
                </div>
                <div className="text-xs font-extrabold uppercase">{item.lineAction}</div>
              </div>
              <div className="mt-1 text-xs text-app-subtle">Qty: {item.qty}</div>
              <div className="mt-1 text-xs text-app-subtle">{item.modifierNames.join(", ") || "No add-ons"}</div>
              {item.kitchenNote && <div className="mt-1 text-xs text-app-info">Note: {item.kitchenNote}</div>}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" className="h-10 px-3" onClick={onClose}>
            Back
          </Button>
          <Button className="h-10 px-3" onClick={onConfirm}>
            Save Order + Print KOT
          </Button>
        </div>
      </div>
    </PickerModal>
  );
}

function labelOrderType(orderType: OrderType): string {
  switch (orderType) {
    case "dine_in":
      return "Dine In";
    case "takeaway":
      return "Takeaway";
    case "delivery":
      return "Delivery";
  }
}

function chunkProducts(products: ProductSummary[], chunkSize: number): ProductSummary[][] {
  const rows: ProductSummary[][] = [];
  for (let index = 0; index < products.length; index += chunkSize) {
    rows.push(products.slice(index, index + chunkSize));
  }
  return rows;
}
