import { useEffect, useMemo, useState } from "react";
import type {
  AssignModifierGroupInput,
  MenuDashboard,
  SaveMenuCategoryInput,
  SaveMenuProductInput,
  SaveModifierGroupInput,
  SaveModifierInput,
  SaveProductVariantInput
} from "../../../shared/contracts/menu-management-contracts";
import { Button } from "../../components/ui/Button";
import { requirePosApi } from "../../utils/pos-api";
import { formatCurrency } from "../../utils/money";

const emptyCategory: SaveMenuCategoryInput = { name: "", code: "", sortOrder: 0, isActive: true };
const emptyProduct: SaveMenuProductInput = {
  categoryUuid: "",
  name: "",
  description: "",
  sku: "",
  barcode: "",
  basePriceMinor: 0,
  gstMode: "exclusive",
  gstRateBasisPoints: 500,
  kitchenStation: "main_kitchen",
  isOnlineVisible: true,
  isFavorite: false,
  imageUrl: "",
  isActive: true,
  sortOrder: 0
};
const emptyGroup: SaveModifierGroupInput = {
  name: "",
  code: "",
  minSelect: 0,
  maxSelect: 1,
  isRequired: false,
  isActive: true
};

export function MenuManagementScreen() {
  const [data, setData] = useState<MenuDashboard | null>(null);
  const [tab, setTab] = useState<"products" | "categories" | "variants" | "modifiers">("products");
  const [categoryForm, setCategoryForm] = useState<SaveMenuCategoryInput>(emptyCategory);
  const [productForm, setProductForm] = useState<SaveMenuProductInput>(emptyProduct);
  const [variantForm, setVariantForm] = useState<SaveProductVariantInput>({ productUuid: "", name: "", priceMinor: 0, isDefault: false, isActive: true });
  const [groupForm, setGroupForm] = useState<SaveModifierGroupInput>(emptyGroup);
  const [modifierForm, setModifierForm] = useState<SaveModifierInput>({ groupUuid: "", name: "", code: "", priceDeltaMinor: 0, isActive: true });
  const [assignment, setAssignment] = useState<AssignModifierGroupInput>({ productUuid: "", groupUuid: "", assigned: true });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    setBusy(true);
    const result = await requirePosApi().menu.dashboard();
    setBusy(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setData(result.data);
    setError(null);
    const firstCategory = result.data.categories[0]?.uuid ?? "";
    const firstProduct = result.data.products[0]?.uuid ?? "";
    const firstGroup = result.data.modifierGroups[0]?.uuid ?? "";
    setProductForm((current) => ({ ...current, categoryUuid: current.categoryUuid || firstCategory }));
    setVariantForm((current) => ({ ...current, productUuid: current.productUuid || firstProduct }));
    setModifierForm((current) => ({ ...current, groupUuid: current.groupUuid || firstGroup }));
    setAssignment((current) => ({
      ...current,
      productUuid: current.productUuid || firstProduct,
      groupUuid: current.groupUuid || firstGroup
    }));
  };

  useEffect(() => {
    void load();
  }, []);

  const saveCategory = async () => {
    const result = await requirePosApi().menu.saveCategory(categoryForm);
    if (result.success) {
      setCategoryForm(emptyCategory);
      await load();
    } else {
      setError(result.error.message);
    }
  };

  const saveProduct = async () => {
    const result = await requirePosApi().menu.saveProduct(productForm);
    if (result.success) {
      setProductForm({ ...emptyProduct, categoryUuid: data?.categories[0]?.uuid ?? "" });
      await load();
    } else {
      setError(result.error.message);
    }
  };

  const saveVariant = async () => {
    const result = await requirePosApi().menu.saveVariant(variantForm);
    if (result.success) {
      setVariantForm({ productUuid: variantForm.productUuid, name: "", priceMinor: 0, isDefault: false, isActive: true });
      await load();
    } else {
      setError(result.error.message);
    }
  };

  const saveGroup = async () => {
    const result = await requirePosApi().menu.saveModifierGroup(groupForm);
    if (result.success) {
      setGroupForm(emptyGroup);
      await load();
    } else {
      setError(result.error.message);
    }
  };

  const saveModifier = async () => {
    const result = await requirePosApi().menu.saveModifier(modifierForm);
    if (result.success) {
      setModifierForm({ groupUuid: modifierForm.groupUuid, name: "", code: "", priceDeltaMinor: 0, isActive: true });
      await load();
    } else {
      setError(result.error.message);
    }
  };

  const assignGroup = async () => {
    const result = await requirePosApi().menu.assignModifierGroup(assignment);
    if (result.success) {
      await load();
    } else {
      setError(result.error.message);
    }
  };

  const products = useMemo(
    () =>
      data?.products.filter((product) => {
        const text = `${product.name} ${product.sku ?? ""} ${product.barcode ?? ""}`.toLowerCase();
        return !query.trim() || text.includes(query.toLowerCase());
      }) ?? [],
    [data, query]
  );

  const editProduct = (product: MenuDashboard["products"][number]) => {
    setProductForm({
      productUuid: product.uuid,
      categoryUuid: product.categoryUuid,
      name: product.name,
      description: product.description ?? "",
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      basePriceMinor: product.basePriceMinor,
      gstMode: product.gstMode,
      gstRateBasisPoints: product.gstRateBasisPoints,
      kitchenStation: product.kitchenStation,
      isOnlineVisible: product.isOnlineVisible,
      isFavorite: product.isFavorite,
      imageUrl: product.imageUrl ?? "",
      isActive: product.isActive,
      sortOrder: product.sortOrder
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Menu Management</h1>
          <p className="text-sm text-app-subtle">Create categories, products, variants and add-ons used by POS.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["products", "categories", "variants", "modifiers"] as const).map((item) => (
            <Button key={item} variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {tab === "products" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_410px]">
          <section className="min-h-0 rounded-lg border border-app-border bg-white">
            <div className="border-b border-app-border p-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, SKU or barcode"
                className="h-11 w-full rounded-md border border-app-border px-3"
              />
            </div>
            <div className="max-h-[calc(100vh-220px)] divide-y divide-app-border overflow-y-auto">
              {products.map((product) => (
                <div key={product.uuid} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-bold">
                      {product.name} {product.isFavorite && "★"}
                    </div>
                    <div className="text-sm text-app-subtle">
                      {product.categoryName} · {formatCurrency(product.basePriceMinor)} · GST {product.gstRateBasisPoints / 100}%
                    </div>
                    <div className="text-xs text-app-subtle">
                      {product.kitchenStation} · {product.isOnlineVisible ? "Online" : "POS only"} · {product.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => editProduct(product)}>
                    Edit
                  </Button>
                </div>
              ))}
              {!busy && products.length === 0 && <div className="p-8 text-center text-app-subtle">No products. Create the first product.</div>}
            </div>
          </section>

          <section className="h-fit rounded-lg border border-app-border bg-white p-4">
            <h2 className="text-lg font-extrabold">{productForm.productUuid ? "Edit Product" : "New Product"}</h2>
            <div className="mt-4 grid gap-3">
              <Select
                label="Category"
                value={productForm.categoryUuid}
                onChange={(value) => setProductForm({ ...productForm, categoryUuid: value })}
                options={(data?.categories ?? []).map((category) => [category.uuid, category.name])}
              />
              <Field label="Product name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="SKU" value={productForm.sku ?? ""} onChange={(value) => setProductForm({ ...productForm, sku: value })} />
                <Field label="Barcode" value={productForm.barcode ?? ""} onChange={(value) => setProductForm({ ...productForm, barcode: value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Price ₹"
                  value={productForm.basePriceMinor / 100}
                  onChange={(value) => setProductForm({ ...productForm, basePriceMinor: Math.round(value * 100) })}
                />
                <NumberField
                  label="GST %"
                  value={productForm.gstRateBasisPoints / 100}
                  onChange={(value) => setProductForm({ ...productForm, gstRateBasisPoints: Math.round(value * 100) })}
                />
              </div>
              <Select
                label="GST mode"
                value={productForm.gstMode}
                onChange={(value) => setProductForm({ ...productForm, gstMode: value as "inclusive" | "exclusive" })}
                options={[
                  ["exclusive", "Exclusive"],
                  ["inclusive", "Inclusive"]
                ]}
              />
              <Field
                label="Kitchen station"
                value={productForm.kitchenStation}
                onChange={(value) => setProductForm({ ...productForm, kitchenStation: value })}
              />
              <Field
                label="Description"
                value={productForm.description ?? ""}
                onChange={(value) => setProductForm({ ...productForm, description: value })}
              />
              <div className="flex flex-wrap gap-4 text-sm">
                <Check label="Active" checked={productForm.isActive !== false} onChange={(value) => setProductForm({ ...productForm, isActive: value })} />
                <Check
                  label="Show online"
                  checked={productForm.isOnlineVisible !== false}
                  onChange={(value) => setProductForm({ ...productForm, isOnlineVisible: value })}
                />
                <Check label="Favorite" checked={Boolean(productForm.isFavorite)} onChange={(value) => setProductForm({ ...productForm, isFavorite: value })} />
              </div>
              <div className="flex gap-2">
                <Button disabled={!productForm.categoryUuid || productForm.name.trim().length < 2} onClick={() => void saveProduct()}>
                  Save Product
                </Button>
                {productForm.productUuid && (
                  <Button
                    variant="secondary"
                    onClick={() => setProductForm({ ...emptyProduct, categoryUuid: data?.categories[0]?.uuid ?? "" })}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "categories" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="divide-y divide-app-border rounded-lg border border-app-border bg-white">
            {data?.categories.map((category) => (
              <div key={category.uuid} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-bold">{category.name}</div>
                  <div className="text-sm text-app-subtle">
                    {category.code} · {category.productCount} products · {category.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setCategoryForm({
                      categoryUuid: category.uuid,
                      name: category.name,
                      code: category.code,
                      sortOrder: category.sortOrder,
                      isActive: category.isActive
                    })
                  }
                >
                  Edit
                </Button>
              </div>
            ))}
          </section>
          <section className="h-fit rounded-lg border border-app-border bg-white p-4">
            <h2 className="text-lg font-extrabold">{categoryForm.categoryUuid ? "Edit Category" : "New Category"}</h2>
            <div className="mt-4 space-y-3">
              <Field label="Name" value={categoryForm.name} onChange={(value) => setCategoryForm({ ...categoryForm, name: value })} />
              <Field label="Code" value={categoryForm.code} onChange={(value) => setCategoryForm({ ...categoryForm, code: value })} />
              <NumberField label="Sort order" value={categoryForm.sortOrder} onChange={(value) => setCategoryForm({ ...categoryForm, sortOrder: Math.round(value) })} />
              <Check label="Active" checked={categoryForm.isActive !== false} onChange={(value) => setCategoryForm({ ...categoryForm, isActive: value })} />
              <div className="flex gap-2">
                <Button disabled={categoryForm.name.trim().length < 2 || !categoryForm.code.trim()} onClick={() => void saveCategory()}>
                  Save Category
                </Button>
                {categoryForm.categoryUuid && (
                  <Button variant="secondary" onClick={() => setCategoryForm(emptyCategory)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "variants" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-lg border border-app-border bg-white">
            <div className="border-b border-app-border p-4 font-extrabold">Existing Variants</div>
            <div className="divide-y divide-app-border">
              {data?.products.flatMap((product) =>
                product.variants.map((variant) => (
                  <div key={variant.uuid} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-bold">{product.name} · {variant.name}</div>
                      <div className="text-sm text-app-subtle">{formatCurrency(variant.priceMinor)} · {variant.isDefault ? "Default" : "Optional"}</div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setVariantForm({
                          variantUuid: variant.uuid,
                          productUuid: product.uuid,
                          name: variant.name,
                          sku: variant.sku ?? "",
                          barcode: variant.barcode ?? "",
                          priceMinor: variant.priceMinor,
                          isDefault: variant.isDefault,
                          isActive: variant.isActive
                        })
                      }
                    >
                      Edit
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
          <section className="h-fit rounded-lg border border-app-border bg-white p-4">
            <h2 className="text-lg font-extrabold">{variantForm.variantUuid ? "Edit Variant" : "New Variant"}</h2>
            <div className="mt-4 space-y-3">
              <Select label="Product" value={variantForm.productUuid} onChange={(value) => setVariantForm({ ...variantForm, productUuid: value })} options={(data?.products ?? []).map((product) => [product.uuid, product.name])} />
              <Field label="Variant name" value={variantForm.name} onChange={(value) => setVariantForm({ ...variantForm, name: value })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="SKU" value={variantForm.sku ?? ""} onChange={(value) => setVariantForm({ ...variantForm, sku: value })} />
                <Field label="Barcode" value={variantForm.barcode ?? ""} onChange={(value) => setVariantForm({ ...variantForm, barcode: value })} />
              </div>
              <NumberField label="Price ₹" value={variantForm.priceMinor / 100} onChange={(value) => setVariantForm({ ...variantForm, priceMinor: Math.round(value * 100) })} />
              <Check label="Default variant" checked={Boolean(variantForm.isDefault)} onChange={(value) => setVariantForm({ ...variantForm, isDefault: value })} />
              <Check label="Active" checked={variantForm.isActive !== false} onChange={(value) => setVariantForm({ ...variantForm, isActive: value })} />
              <Button disabled={!variantForm.productUuid || !variantForm.name.trim()} onClick={() => void saveVariant()}>
                Save Variant
              </Button>
            </div>
          </section>
        </div>
      )}

      {tab === "modifiers" && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-app-border bg-white">
              <div className="border-b border-app-border p-4 font-extrabold">Modifier Groups & Options</div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {data?.modifierGroups.map((group) => (
                  <div key={group.uuid} className="rounded-md border border-app-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold">{group.name}</div>
                        <div className="text-xs text-app-subtle">Select {group.minSelect}–{group.maxSelect}</div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setGroupForm({
                            groupUuid: group.uuid,
                            name: group.name,
                            code: group.code,
                            minSelect: group.minSelect,
                            maxSelect: group.maxSelect,
                            isRequired: group.isRequired,
                            isActive: true
                          })
                        }
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      {group.modifiers.map((modifier) => (
                        <button
                          type="button"
                          key={modifier.uuid}
                          className="block w-full rounded bg-app-muted px-2 py-1 text-left"
                          onClick={() =>
                            setModifierForm({
                              modifierUuid: modifier.uuid,
                              groupUuid: group.uuid,
                              name: modifier.name,
                              code: modifier.code,
                              priceDeltaMinor: modifier.priceDeltaMinor,
                              isActive: modifier.isActive
                            })
                          }
                        >
                          {modifier.name} · {formatCurrency(modifier.priceDeltaMinor)}
                        </button>
                      ))}
                      {group.modifiers.length === 0 && <div className="text-app-subtle">No options</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="h-fit space-y-5 rounded-lg border border-app-border bg-white p-4">
              <div>
                <h2 className="text-lg font-extrabold">Modifier Group</h2>
                <div className="mt-3 space-y-2">
                  <Field label="Name" value={groupForm.name} onChange={(value) => setGroupForm({ ...groupForm, name: value })} />
                  <Field label="Code" value={groupForm.code} onChange={(value) => setGroupForm({ ...groupForm, code: value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField label="Min" value={groupForm.minSelect} onChange={(value) => setGroupForm({ ...groupForm, minSelect: Math.round(value) })} />
                    <NumberField label="Max" value={groupForm.maxSelect} onChange={(value) => setGroupForm({ ...groupForm, maxSelect: Math.round(value) })} />
                  </div>
                  <Check label="Required" checked={Boolean(groupForm.isRequired)} onChange={(value) => setGroupForm({ ...groupForm, isRequired: value })} />
                  <Button disabled={!groupForm.name.trim() || !groupForm.code.trim()} onClick={() => void saveGroup()}>
                    Save Group
                  </Button>
                </div>
              </div>
              <div className="border-t border-app-border pt-4">
                <h2 className="text-lg font-extrabold">Add-on Option</h2>
                <div className="mt-3 space-y-2">
                  <Select label="Group" value={modifierForm.groupUuid} onChange={(value) => setModifierForm({ ...modifierForm, groupUuid: value })} options={(data?.modifierGroups ?? []).map((group) => [group.uuid, group.name])} />
                  <Field label="Name" value={modifierForm.name} onChange={(value) => setModifierForm({ ...modifierForm, name: value })} />
                  <Field label="Code" value={modifierForm.code} onChange={(value) => setModifierForm({ ...modifierForm, code: value })} />
                  <NumberField label="Extra price ₹" value={modifierForm.priceDeltaMinor / 100} onChange={(value) => setModifierForm({ ...modifierForm, priceDeltaMinor: Math.round(value * 100) })} />
                  <Button disabled={!modifierForm.groupUuid || !modifierForm.name.trim() || !modifierForm.code.trim()} onClick={() => void saveModifier()}>
                    Save Option
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-app-border bg-white p-4">
            <h2 className="text-lg font-extrabold">Assign Modifier Group to Product</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
              <Select label="Product" value={assignment.productUuid} onChange={(value) => setAssignment({ ...assignment, productUuid: value })} options={(data?.products ?? []).map((product) => [product.uuid, product.name])} />
              <Select label="Group" value={assignment.groupUuid} onChange={(value) => setAssignment({ ...assignment, groupUuid: value })} options={(data?.modifierGroups ?? []).map((group) => [group.uuid, group.name])} />
              <Button className="self-end" onClick={() => { setAssignment({ ...assignment, assigned: true }); void requirePosApi().menu.assignModifierGroup({ ...assignment, assigned: true }).then(async (result) => { if (result.success) await load(); else setError(result.error.message); }); }}>
                Assign
              </Button>
              <Button variant="danger" className="self-end" onClick={() => { setAssignment({ ...assignment, assigned: false }); void requirePosApi().menu.assignModifierGroup({ ...assignment, assigned: false }).then(async (result) => { if (result.success) await load(); else setError(result.error.message); }); }}>
                Remove
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-app-border px-3 font-normal" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="mt-1 h-10 w-full rounded-md border border-app-border px-3 font-normal" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-app-border px-3 font-normal">
        <option value="">Select</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
