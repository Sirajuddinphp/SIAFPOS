import type Database from "better-sqlite3";
import type { ProductCategory } from "../../shared/contracts/catalog-contracts";

type CategoryRow = {
  uuid: string;
  name: string;
  code: string;
  sort_order: number;
  is_active: 0 | 1;
};

export class CategoryRepository {
  constructor(private readonly db: Database.Database) {}

  listActive(): ProductCategory[] {
    return (
      this.db
        .prepare("SELECT uuid, name, code, sort_order, is_active FROM categories WHERE is_active = 1 ORDER BY sort_order, name")
        .all() as CategoryRow[]
    ).map(mapCategory);
  }

  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number };
    return row.count;
  }
}

function mapCategory(row: CategoryRow): ProductCategory {
  return {
    uuid: row.uuid,
    name: row.name,
    code: row.code,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1
  };
}
