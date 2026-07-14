import { describe,expect,it } from "vitest";
import { InventoryService } from "../electron/services/inventory-service";
import { createMigratedTestDatabase,seedAuthFixture } from "./test-helpers";
describe("phase 7 inventory",()=>{
 it("tracks opening stock, wastage and purchases",()=>{const db=createMigratedTestDatabase();const {user}=seedAuthFixture(db);const service=new InventoryService(db);const item=service.saveItem({name:"Cheese",sku:"CHEESE",unit:"kg",reorderLevel:2,costPerUnitMinor:50000,openingQty:5},user.uuid);expect(item.onHand).toBe(5);expect(service.adjust({itemUuid:item.uuid,qtyDelta:1,type:"wastage"},user.uuid).onHand).toBe(4);const supplier=service.saveSupplier({name:"Food Supplier"});service.createPurchase({supplierUuid:supplier.uuid,purchasedAt:new Date().toISOString(),items:[{inventoryItemUuid:item.uuid,qty:3,unitCostMinor:52000}]},user.uuid);expect(service.dashboard().items.find(x=>x.uuid===item.uuid)?.onHand).toBe(7);db.close();});
});
