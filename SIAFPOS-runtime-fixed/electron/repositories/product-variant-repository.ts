import type Database from "better-sqlite3";
import type { ProductVariant } from "../../shared/contracts/catalog-contracts";

type VariantRow = {
  uuid: string;
  product_uuid: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price_minor: number;
  is_default: 0 | 1;
  is_active: 0 | 1;
};

export class ProductVariantRepository {
  constructor(private readonly db: Database.Database) {}

  listByProduct(productUuid: string): ProductVariant[] {
    return (
      this.db
        .prepare(
          `SELECT uuid, product_uuid, name, sku, barcode, price_minor, is_default, is_active
           FROM product_variants
           WHERE product_uuid = ? AND is_active = 1
           ORDER BY is_default DESC, name`
        )
        .all(productUuid) as VariantRow[]
    ).map(mapVariant);
  }

  findByUuid(variantUuid: string): ProductVariant | null {
    const row = this.db
      .prepare(
        "SELECT uuid, product_uuid, name, sku, barcode, price_minor, is_default, is_active FROM product_variants WHERE uuid = ?"
      )
      .get(variantUuid) as VariantRow | undefined;

    return row ? mapVariant(row) : null;
  }
}

function mapVariant(row: VariantRow): ProductVariant {
  return {
    uuid: row.uuid,
    productUuid: row.product_uuid,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    priceMinor: row.price_minor,
    isDefault: row.is_default === 1,
    isActive: row.is_active === 1
  };
}
