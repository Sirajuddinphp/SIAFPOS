export type GstPricingMode = "inclusive" | "exclusive";

export type ProductCategory = {
  uuid: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
};

export type ProductVariant = {
  uuid: string;
  productUuid: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  priceMinor: number;
  isDefault: boolean;
  isActive: boolean;
};

export type ModifierOption = {
  uuid: string;
  groupUuid: string;
  name: string;
  code: string;
  priceDeltaMinor: number;
  isActive: boolean;
};

export type ModifierGroup = {
  uuid: string;
  name: string;
  code: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  modifiers: ModifierOption[];
};

export type ProductSummary = {
  uuid: string;
  categoryUuid: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  basePriceMinor: number;
  gstMode: GstPricingMode;
  gstRateBasisPoints: number;
  hasVariants: boolean;
  hasModifiers: boolean;
  isActive: boolean;
};

export type ProductDetail = ProductSummary & {
  description: string | null;
  categoryName: string;
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
};

export type ProductSearchInput = {
  categoryUuid?: string;
  query?: string;
  exactBarcode?: string;
  offset: number;
  limit: number;
};

export type ProductSearchResult = {
  items: ProductSummary[];
  total: number;
  offset: number;
  limit: number;
};

export type CatalogBootstrap = {
  categories: ProductCategory[];
  topProducts: ProductSummary[];
};
