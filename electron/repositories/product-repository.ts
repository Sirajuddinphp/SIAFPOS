import type Database from "better-sqlite3";
import type { ProductDetail, ProductSearchInput, ProductSearchResult, ProductSummary } from "../../shared/contracts/catalog-contracts";
import { ModifierGroupRepository } from "./modifier-group-repository";
import { ProductVariantRepository } from "./product-variant-repository";

type ProductRow = {
  uuid: string;
  category_uuid: string;
  category_name?: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  base_price_minor: number;
  gst_mode: "inclusive" | "exclusive";
  gst_rate_basis_points: number;
  is_active: 0 | 1;
  variant_count?: number;
  modifier_group_count?: number;
};

export class ProductRepository {
  constructor(private readonly db: Database.Database) {}

  search(input: ProductSearchInput): ProductSearchResult {
    const where: string[] = ["p.is_active = 1"];
    const params: unknown[] = [];

    if (input.categoryUuid) {
      where.push("p.category_uuid = ?");
      params.push(input.categoryUuid);
    }

    if (input.exactBarcode) {
      where.push("(p.barcode = ? OR pv.barcode = ?)");
      params.push(input.exactBarcode, input.exactBarcode);
    } else if (input.query?.trim()) {
      where.push("(p.search_text LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)");
      const query = `%${input.query.trim().toLowerCase()}%`;
      params.push(query, query, query);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const countRow = this.db
      .prepare(
        `SELECT COUNT(DISTINCT p.uuid) AS count
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_uuid = p.uuid
         ${whereSql}`
      )
      .get(...params) as { count: number };

    const rows = this.db
      .prepare(
        `SELECT
            p.uuid,
            p.category_uuid,
            p.name,
            p.description,
            p.sku,
            p.barcode,
            p.base_price_minor,
            p.gst_mode,
            p.gst_rate_basis_points,
            p.is_active,
            COUNT(DISTINCT pv.uuid) AS variant_count,
            COUNT(DISTINCT pmg.modifier_group_uuid) AS modifier_group_count
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_uuid = p.uuid AND pv.is_active = 1
         LEFT JOIN product_modifier_groups pmg ON pmg.product_uuid = p.uuid
         ${whereSql}
         GROUP BY p.uuid
         ORDER BY p.sort_order, p.name
         LIMIT ? OFFSET ?`
      )
      .all(...params, input.limit, input.offset) as ProductRow[];

    return {
      items: rows.map(mapSummary),
      total: countRow.count,
      offset: input.offset,
      limit: input.limit
    };
  }

  listTop(limit: number): ProductSummary[] {
    return this.search({ offset: 0, limit }).items;
  }

  getProduct(productUuid: string): ProductDetail | null {
    return this.findByUuid(productUuid);
  }

  findByUuid(productUuid: string): ProductDetail | null {
    const row = this.db
      .prepare(
        `SELECT p.uuid, p.category_uuid, c.name AS category_name, p.name, p.description, p.sku, p.barcode,
                p.base_price_minor, p.gst_mode, p.gst_rate_basis_points, p.is_active,
                COUNT(DISTINCT pv.uuid) AS variant_count,
                COUNT(DISTINCT pmg.modifier_group_uuid) AS modifier_group_count
         FROM products p
         INNER JOIN categories c ON c.uuid = p.category_uuid
         LEFT JOIN product_variants pv ON pv.product_uuid = p.uuid AND pv.is_active = 1
         LEFT JOIN product_modifier_groups pmg ON pmg.product_uuid = p.uuid
         WHERE p.uuid = ?
         GROUP BY p.uuid`
      )
      .get(productUuid) as ProductRow | undefined;

    if (!row) {
      return null;
    }

    return {
      ...mapSummary(row),
      description: row.description,
      categoryName: row.category_name ?? "",
      variants: new ProductVariantRepository(this.db).listByProduct(productUuid),
      modifierGroups: new ModifierGroupRepository(this.db).listByProduct(productUuid)
    };
  }
}

function mapSummary(row: ProductRow): ProductSummary {
  return {
    uuid: row.uuid,
    categoryUuid: row.category_uuid,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    basePriceMinor: row.base_price_minor,
    gstMode: row.gst_mode,
    gstRateBasisPoints: row.gst_rate_basis_points,
    hasVariants: (row.variant_count ?? 0) > 0,
    hasModifiers: (row.modifier_group_count ?? 0) > 0,
    isActive: row.is_active === 1
  };
}
