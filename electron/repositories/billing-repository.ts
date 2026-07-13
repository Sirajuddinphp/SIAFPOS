import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { BillDetail, PaymentInput, PaymentRecord } from "../../shared/contracts/billing-contracts";

type BillRow = { uuid:string; bill_no:string; order_uuid:string; order_no:string; status:"open"|"settled"|"void"; subtotal_minor:number; discount_minor:number; taxable_minor:number; tax_minor:number; grand_total_minor:number; paid_minor:number; balance_minor:number; settled_at:string|null; created_at:string };
type PaymentRow = { uuid:string; payment_mode:PaymentRecord["mode"]; amount_minor:number; reference:string|null; received_minor:number|null; change_minor:number; created_at:string };

export class BillingRepository {
  constructor(private readonly db: Database.Database) {}
  getByOrder(orderUuid: string): BillDetail | null {
    const row = this.db.prepare(`SELECT b.*, o.order_no FROM bills b JOIN orders o ON o.uuid=b.order_uuid WHERE b.order_uuid=?`).get(orderUuid) as BillRow|undefined;
    return row ? this.map(row) : null;
  }
  get(billUuid: string): BillDetail | null {
    const row = this.db.prepare(`SELECT b.*, o.order_no FROM bills b JOIN orders o ON o.uuid=b.order_uuid WHERE b.uuid=?`).get(billUuid) as BillRow|undefined;
    return row ? this.map(row) : null;
  }
  create(input:{orderUuid:string;shiftUuid:string;userUuid:string;subtotalMinor:number;discountMinor:number;taxableMinor:number;taxMinor:number;grandTotalMinor:number;now:string}): BillDetail {
    const uuid=randomUUID(); const billNo=`BILL-${Date.now().toString().slice(-9)}`;
    this.db.prepare(`INSERT INTO bills (uuid,bill_no,order_uuid,shift_uuid,status,subtotal_minor,discount_minor,taxable_minor,tax_minor,grand_total_minor,paid_minor,balance_minor,created_by_user_uuid,created_at,updated_at)
      VALUES (?,?,?,?,'open',?,?,?,?,?,0,?,?,?,?)`)
      .run(uuid,billNo,input.orderUuid,input.shiftUuid,input.subtotalMinor,input.discountMinor,input.taxableMinor,input.taxMinor,input.grandTotalMinor,input.grandTotalMinor,input.userUuid,input.now,input.now);
    return this.get(uuid)!;
  }
  addPayments(billUuid:string, payments:PaymentInput[], userUuid:string, now:string): void {
    const insert=this.db.prepare(`INSERT INTO payments (uuid,bill_uuid,payment_mode,amount_minor,reference,received_minor,change_minor,created_by_user_uuid,created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
    for(const p of payments){ const change=p.mode==='cash' && p.receivedMinor ? Math.max(0,p.receivedMinor-p.amountMinor):0; insert.run(randomUUID(),billUuid,p.mode,p.amountMinor,p.reference??null,p.receivedMinor??null,change,userUuid,now); }
  }
  settle(billUuid:string, paidMinor:number, now:string): void { this.db.prepare("UPDATE bills SET status='settled', paid_minor=?, balance_minor=0, settled_at=?, updated_at=? WHERE uuid=?").run(paidMinor,now,now,billUuid); }
  createPrintJob(billUuid:string,userUuid:string,copyType:"original"|"duplicate",payload:unknown,now:string):string { const uuid=randomUUID(); this.db.prepare(`INSERT INTO print_jobs (uuid,document_type,document_uuid,status,copy_type,payload_json,created_by_user_uuid,created_at) VALUES (?,'receipt',?,'pending',?,?,?,?)`).run(uuid,billUuid,copyType,JSON.stringify(payload),userUuid,now); return uuid; }
  private payments(billUuid:string):PaymentRecord[]{ const rows=this.db.prepare("SELECT * FROM payments WHERE bill_uuid=? ORDER BY id").all(billUuid) as PaymentRow[]; return rows.map(r=>({uuid:r.uuid,mode:r.payment_mode,amountMinor:r.amount_minor,reference:r.reference??undefined,receivedMinor:r.received_minor??undefined,changeMinor:r.change_minor,createdAt:r.created_at})); }
  private map(r:BillRow):BillDetail { return {uuid:r.uuid,billNo:r.bill_no,orderUuid:r.order_uuid,orderNo:r.order_no,status:r.status,subtotalMinor:r.subtotal_minor,discountMinor:r.discount_minor,taxableMinor:r.taxable_minor,taxMinor:r.tax_minor,grandTotalMinor:r.grand_total_minor,paidMinor:r.paid_minor,balanceMinor:r.balance_minor,payments:this.payments(r.uuid),settledAt:r.settled_at,createdAt:r.created_at}; }
}
