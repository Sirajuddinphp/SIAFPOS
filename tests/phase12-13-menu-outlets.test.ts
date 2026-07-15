import { describe, expect, it } from "vitest";
import { MenuManagementService } from "../electron/services/menu-management-service";
import { MultiOutletService } from "../electron/services/multi-outlet-service";
import { InventoryService } from "../electron/services/inventory-service";
import { createMigratedTestDatabase, seedAuthFixture } from "./test-helpers";

describe("phase 12 menu and phase 13 outlets",()=>{
 it("creates categories and products for POS",()=>{const db=createMigratedTestDatabase();seedAuthFixture(db);const service=new MenuManagementService(db);const category=service.saveCategory({name:"Pizza",code:"PIZ",sortOrder:1,isActive:true});const product=service.saveProduct({categoryUuid:category.uuid,name:"Margherita",basePriceMinor:19900,gstMode:"exclusive",gstRateBasisPoints:500,kitchenStation:"main_kitchen",isOnlineVisible:true,isFavorite:true,isActive:true,sortOrder:1});expect(service.dashboard().products.find(x=>x.uuid===product.uuid)?.name).toBe("Margherita");db.close();});
 it("creates and receives a stock transfer",()=>{const db=createMigratedTestDatabase();const {restaurant,outlet,user}=seedAuthFixture(db);const inventory=new InventoryService(db);const item=inventory.saveItem({name:"Cheese",unit:"kg",reorderLevel:1,costPerUnitMinor:50000,openingQty:10},user.uuid);const service=new MultiOutletService(db);const second=service.saveOutlet(restaurant.uuid,{name:"Branch 2",code:"B2",status:"active"});service.seedCurrentOutletBalance(outlet.uuid);const transferUuid=service.createTransfer(restaurant.uuid,{fromOutletUuid:outlet.uuid,toOutletUuid:second.uuid,items:[{inventoryItemUuid:item.uuid,qty:2}]},user.uuid);service.sendTransfer(restaurant.uuid,transferUuid);service.receiveTransfer(restaurant.uuid,transferUuid);const dashboard=service.dashboard(restaurant.uuid);expect(dashboard.transfers[0]?.status).toBe("received");expect(dashboard.balances.find(x=>x.outletUuid===second.uuid&&x.inventoryItemUuid===item.uuid)?.onHand).toBe(2);db.close();});
});
