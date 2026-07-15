import { describe, expect, it, vi } from "vitest";
import { createMigratedTestDatabase, seedAuthFixture } from "./test-helpers";
import { CrmService } from "../electron/services/crm-service";
import { CustomerService } from "../electron/services/customer-service";
import { OnlineService } from "../electron/services/online-service";
vi.mock("electron",()=>({app:{isPackaged:false,getPath:()=>process.cwd(),getVersion:()=>"0.1.0"}}));

describe("phase 10 CRM and phase 11 online ordering",()=>{
 it("tracks loyalty balances and coupons",()=>{const db=createMigratedTestDatabase();const fixture=seedAuthFixture(db);const customers=new CustomerService(db);const customer=customers.save({name:"Loyal Guest",phone:"9999999999"});const crm=new CrmService(db);crm.adjust({customerUuid:customer.uuid,transactionType:"points",direction:"credit",amount:100,reason:"Welcome"},fixture.user.uuid);crm.saveCoupon({code:"SAVE10",name:"Save ten",discountType:"percentage",discountValue:10});const dashboard=crm.dashboard();expect(dashboard.accounts.find(x=>x.customerUuid===customer.uuid)?.pointsBalance).toBe(100);expect(dashboard.coupons[0]?.code).toBe("SAVE10");db.close();});
 it("creates channels, qr tokens and online orders", () => {
    const db = createMigratedTestDatabase();
    seedAuthFixture(db);

    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO tables (
        uuid,
        name,
        floor,
        capacity,
        sort_order,
        status,
        created_at,
        updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        "table-test-uuid",
        "T1",
        "Main Hall",
        4,
        1,
        "available",
        now,
        now
    );

    const online = new OnlineService(db);

    const channel = online.saveChannel({
        name: "MealHi5",
        channelType: "mealhi5"
    });

    const table = db
        .prepare("SELECT uuid FROM tables LIMIT 1")
        .get() as { uuid: string };

    const qr = online.generateQr({
        tableUuid: table.uuid
    });

    const order = online.createOrder({
        channelUuid: channel.uuid,
        orderType: "takeaway",
        customerName: "Online Guest",
        items: [
        {
            itemName: "Burger",
            qty: 2,
            unitPriceMinor: 15000
        }
        ]
    });

    expect(qr.token.length).toBeGreaterThan(10);
    expect(order.grandTotalMinor).toBe(30000);
    expect(online.dashboard().pendingCount).toBe(1);

    db.close();
    });
});
