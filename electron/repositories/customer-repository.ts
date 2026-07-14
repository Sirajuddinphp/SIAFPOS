import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { CustomerSummary, SaveCustomerInput } from "../../shared/contracts/customer-contracts";

type CustomerRow = { uuid:string; name:string; phone:string|null; email:string|null; address_summary:string|null; is_active:0|1 };
export class CustomerRepository {
  constructor(private readonly db: Database.Database) {}
  findByUuid(uuid:string):CustomerSummary|null { const row=this.db.prepare("SELECT uuid,name,phone,email,address_summary,is_active FROM customers WHERE uuid=?").get(uuid) as CustomerRow|undefined; return row?mapCustomer(row):null; }
  search(query:string,limit:number):CustomerSummary[]{ const q=query.trim(); if(!q)return this.listRecent(limit); const like=`%${q}%`; return (this.db.prepare(`SELECT uuid,name,phone,email,address_summary,is_active FROM customers WHERE (name LIKE ? OR phone LIKE ? OR email LIKE ?) ORDER BY is_active DESC,name LIMIT ?`).all(like,like,like,limit) as CustomerRow[]).map(mapCustomer); }
  listRecent(limit:number):CustomerSummary[]{ return (this.db.prepare(`SELECT uuid,name,phone,email,address_summary,is_active FROM customers ORDER BY updated_at DESC,name LIMIT ?`).all(limit) as CustomerRow[]).map(mapCustomer); }
  save(input:SaveCustomerInput,now:string):CustomerSummary {
    const uuid=input.customerUuid??randomUUID();
    this.db.prepare(`INSERT INTO customers(uuid,name,phone,email,address_summary,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(uuid) DO UPDATE SET name=excluded.name,phone=excluded.phone,email=excluded.email,address_summary=excluded.address_summary,is_active=excluded.is_active,updated_at=excluded.updated_at`)
      .run(uuid,input.name,input.phone||null,input.email||null,input.addressSummary||null,input.isActive===false?0:1,now,now);
    const result=this.findByUuid(uuid); if(!result)throw new Error("Customer save failed."); return result;
  }
  setActive(uuid:string,isActive:boolean,now:string):CustomerSummary { this.db.prepare("UPDATE customers SET is_active=?,updated_at=? WHERE uuid=?").run(isActive?1:0,now,uuid); const result=this.findByUuid(uuid); if(!result)throw Object.assign(new Error("Customer not found."),{code:"NOT_FOUND"}); return result; }
}
function mapCustomer(row:CustomerRow):CustomerSummary{return{uuid:row.uuid,name:row.name,phone:row.phone,email:row.email,addressSummary:row.address_summary,isActive:row.is_active===1};}
