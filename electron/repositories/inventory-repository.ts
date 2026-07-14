import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { CreatePurchaseInput, InventoryDashboard, InventoryItem, PurchaseSummary, Recipe, SaveInventoryItemInput, SaveRecipeInput, SaveSupplierInput, Supplier } from "../../shared/contracts/inventory-contracts";

export class InventoryRepository {
  constructor(private readonly db:Database.Database){}
  dashboard():InventoryDashboard{
    const items=(this.db.prepare(`SELECT i.uuid,i.name,i.sku,i.unit,i.reorder_level,i.cost_per_unit_minor,i.is_active,COALESCE(SUM(m.qty_delta),0) on_hand FROM inventory_items i LEFT JOIN stock_movements m ON m.inventory_item_uuid=i.uuid GROUP BY i.uuid ORDER BY i.name`).all() as any[]).map(r=>({uuid:r.uuid,name:r.name,sku:r.sku,unit:r.unit,reorderLevel:r.reorder_level,costPerUnitMinor:r.cost_per_unit_minor,onHand:Number(r.on_hand),isLowStock:Number(r.on_hand)<=r.reorder_level,isActive:r.is_active===1} satisfies InventoryItem));
    const suppliers=(this.db.prepare(`SELECT uuid,name,phone,email,address,is_active FROM suppliers ORDER BY is_active DESC,name`).all() as any[]).map(mapSupplier);
    const purchases=(this.db.prepare(`SELECT p.uuid,p.purchase_no,p.invoice_no,p.status,p.total_minor,p.purchased_at,s.name supplier_name FROM purchases p LEFT JOIN suppliers s ON s.uuid=p.supplier_uuid ORDER BY p.purchased_at DESC LIMIT 100`).all() as any[]).map(mapPurchase);
    const recipes=this.listRecipes();
    return {items,lowStockCount:items.filter(i=>i.isActive&&i.isLowStock).length,stockValueMinor:Math.round(items.reduce((s,i)=>s+i.onHand*i.costPerUnitMinor,0)),suppliers,purchases,recipes};
  }
  saveItem(input:SaveInventoryItemInput,userUuid:string,now:string):InventoryItem{
    const uuid=input.itemUuid??randomUUID();
    this.db.prepare(`INSERT INTO inventory_items(uuid,name,sku,unit,reorder_level,cost_per_unit_minor,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET name=excluded.name,sku=excluded.sku,unit=excluded.unit,reorder_level=excluded.reorder_level,cost_per_unit_minor=excluded.cost_per_unit_minor,is_active=excluded.is_active,updated_at=excluded.updated_at`).run(uuid,input.name,input.sku||null,input.unit,input.reorderLevel,input.costPerUnitMinor,input.isActive===false?0:1,now,now);
    if(!input.itemUuid && (input.openingQty??0)>0)this.insertMovement(uuid,"opening",input.openingQty!,input.costPerUnitMinor,"inventory_item",uuid,"Opening stock",userUuid,now);
    return this.dashboard().items.find(i=>i.uuid===uuid)!;
  }
  adjust(itemUuid:string,type:"wastage"|"adjustment"|"return",qtyDelta:number,notes:string|undefined,userUuid:string,now:string):InventoryItem{
    const effective=type==="wastage"?-Math.abs(qtyDelta):qtyDelta;
    this.insertMovement(itemUuid,type,effective,0,"inventory_item",itemUuid,notes,userUuid,now);
    return this.dashboard().items.find(i=>i.uuid===itemUuid)!;
  }
  saveSupplier(input:SaveSupplierInput,now:string):Supplier{
    const uuid=input.supplierUuid??randomUUID();
    this.db.prepare(`INSERT INTO suppliers(uuid,name,phone,email,address,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET name=excluded.name,phone=excluded.phone,email=excluded.email,address=excluded.address,is_active=excluded.is_active,updated_at=excluded.updated_at`).run(uuid,input.name,input.phone||null,input.email||null,input.address||null,input.isActive===false?0:1,now,now);
    const row=this.db.prepare(`SELECT uuid,name,phone,email,address,is_active FROM suppliers WHERE uuid=?`).get(uuid) as any; return mapSupplier(row);
  }
  saveRecipe(input:SaveRecipeInput,now:string):Recipe{
    const uuid=input.recipeUuid??randomUUID();
    const tx=this.db.transaction(()=>{this.db.prepare(`INSERT INTO recipes(uuid,product_uuid,yield_qty,notes,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET product_uuid=excluded.product_uuid,yield_qty=excluded.yield_qty,notes=excluded.notes,updated_at=excluded.updated_at`).run(uuid,input.productUuid,input.yieldQty,input.notes||null,now,now);this.db.prepare(`DELETE FROM recipe_items WHERE recipe_uuid=?`).run(uuid);const stmt=this.db.prepare(`INSERT INTO recipe_items(uuid,recipe_uuid,inventory_item_uuid,qty,created_at) VALUES(?,?,?,?,?)`);for(const line of input.items)stmt.run(randomUUID(),uuid,line.inventoryItemUuid,line.qty,now);});tx();return this.listRecipes().find(r=>r.uuid===uuid)!;
  }
  listRecipes():Recipe[]{
    const rows=this.db.prepare(`SELECT r.uuid,r.product_uuid,p.name product_name,r.yield_qty,r.notes FROM recipes r JOIN products p ON p.uuid=r.product_uuid ORDER BY p.name`).all() as any[];
    const lineStmt=this.db.prepare(`SELECT ri.inventory_item_uuid,i.name item_name,i.unit,ri.qty FROM recipe_items ri JOIN inventory_items i ON i.uuid=ri.inventory_item_uuid WHERE ri.recipe_uuid=? ORDER BY i.name`);
    return rows.map(r=>({uuid:r.uuid,productUuid:r.product_uuid,productName:r.product_name,yieldQty:r.yield_qty,notes:r.notes,items:(lineStmt.all(r.uuid) as any[]).map(x=>({inventoryItemUuid:x.inventory_item_uuid,itemName:x.item_name,unit:x.unit,qty:x.qty}))}));
  }
  createPurchase(input:CreatePurchaseInput,userUuid:string,now:string):PurchaseSummary{
    const uuid=randomUUID(), no=`PUR-${Date.now()}`; const total=input.items.reduce((s,i)=>s+Math.round(i.qty*i.unitCostMinor),0);
    const tx=this.db.transaction(()=>{this.db.prepare(`INSERT INTO purchases(uuid,purchase_no,supplier_uuid,invoice_no,status,total_minor,notes,purchased_at,posted_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(uuid,no,input.supplierUuid||null,input.invoiceNo||null,"posted",total,input.notes||null,input.purchasedAt,now,now,now);const stmt=this.db.prepare(`INSERT INTO purchase_items(uuid,purchase_uuid,inventory_item_uuid,qty,unit_cost_minor,line_total_minor,created_at) VALUES(?,?,?,?,?,?,?)`);for(const line of input.items){stmt.run(randomUUID(),uuid,line.inventoryItemUuid,line.qty,line.unitCostMinor,Math.round(line.qty*line.unitCostMinor),now);this.insertMovement(line.inventoryItemUuid,"purchase",line.qty,line.unitCostMinor,"purchase",uuid,input.notes,userUuid,now);this.db.prepare(`UPDATE inventory_items SET cost_per_unit_minor=?,updated_at=? WHERE uuid=?`).run(line.unitCostMinor,now,line.inventoryItemUuid);}});tx();return this.dashboard().purchases.find(p=>p.uuid===uuid)!;
  }
  cancelPurchase(uuid:string,userUuid:string,now:string):PurchaseSummary{
    const purchase=this.db.prepare(`SELECT status FROM purchases WHERE uuid=?`).get(uuid) as any;if(!purchase)throw Object.assign(new Error("Purchase not found."),{code:"NOT_FOUND"});if(purchase.status!=="posted")throw Object.assign(new Error("Only posted purchases can be cancelled."),{code:"INVALID_STATE"});
    const lines=this.db.prepare(`SELECT inventory_item_uuid,qty,unit_cost_minor FROM purchase_items WHERE purchase_uuid=?`).all(uuid) as any[];
    const tx=this.db.transaction(()=>{for(const l of lines)this.insertMovement(l.inventory_item_uuid,"return",-l.qty,l.unit_cost_minor,"purchase_cancel",uuid,"Purchase cancelled",userUuid,now);this.db.prepare(`UPDATE purchases SET status='cancelled',updated_at=? WHERE uuid=?`).run(now,uuid);});tx();return this.dashboard().purchases.find(p=>p.uuid===uuid)!;
  }
  private insertMovement(itemUuid:string,type:string,qty:number,cost:number,refType:string,refUuid:string,notes:string|undefined,userUuid:string,now:string){this.db.prepare(`INSERT INTO stock_movements(uuid,inventory_item_uuid,movement_type,qty_delta,unit_cost_minor,reference_type,reference_uuid,notes,created_by_user_uuid,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).run(randomUUID(),itemUuid,type,qty,cost,refType,refUuid,notes||null,userUuid,now);}
}
function mapSupplier(r:any):Supplier{return{uuid:r.uuid,name:r.name,phone:r.phone,email:r.email,address:r.address,isActive:r.is_active===1};}
function mapPurchase(r:any):PurchaseSummary{return{uuid:r.uuid,purchaseNo:r.purchase_no,supplierName:r.supplier_name,invoiceNo:r.invoice_no,status:r.status,totalMinor:r.total_minor,purchasedAt:r.purchased_at};}
