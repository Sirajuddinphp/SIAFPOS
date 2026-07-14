import type Database from "better-sqlite3";
import type { CustomerSummary } from "../../shared/contracts/customer-contracts";

type CustomerRow = {
  uuid: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_summary: string | null;
  is_active: 0 | 1;
};

export class CustomerRepository {
  constructor(private readonly db: Database.Database) {}

  findByUuid(uuid: string): CustomerSummary | null {
    const row = this.db
      .prepare("SELECT uuid, name, phone, email, address_summary, is_active FROM customers WHERE uuid = ?")
      .get(uuid) as CustomerRow | undefined;
    return row ? mapCustomer(row) : null;
  }

  search(query: string, limit: number): CustomerSummary[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.listRecent(limit);
    }

    const like = `%${trimmed}%`;
    return (
      this.db
        .prepare(
          `SELECT uuid, name, phone, email, address_summary, is_active
           FROM customers
           WHERE is_active = 1 AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)
           ORDER BY name
           LIMIT ?`
        )
        .all(like, like, like, limit) as CustomerRow[]
    ).map(mapCustomer);
  }

  listRecent(limit: number): CustomerSummary[] {
    return (
      this.db
        .prepare(
          `SELECT uuid, name, phone, email, address_summary, is_active
           FROM customers
           WHERE is_active = 1
           ORDER BY updated_at DESC, name
           LIMIT ?`
        )
        .all(limit) as CustomerRow[]
    ).map(mapCustomer);
  }
}

function mapCustomer(row: CustomerRow): CustomerSummary {
  return {
    uuid: row.uuid,
    name: row.name,
    phone: row.phone,
    email: row.email,
    addressSummary: row.address_summary,
    isActive: row.is_active === 1
  };
}
