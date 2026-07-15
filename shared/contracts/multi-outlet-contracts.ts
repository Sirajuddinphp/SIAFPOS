export type OutletAdmin = { uuid:string; restaurantUuid:string; name:string; code:string; address:string|null; city:string|null; state:string|null; postalCode:string|null; phone:string|null; status:"active"|"inactive" };
export type SaveOutletInput = { outletUuid?:string; name:string; code:string; address?:string; city?:string; state?:string; postalCode?:string; phone?:string; status?:"active"|"inactive" };
export type OutletBalance = { outletUuid:string; outletName:string; inventoryItemUuid:string; itemName:string; unit:string; onHand:number };
export type TransferLineInput = { inventoryItemUuid:string; qty:number };
export type CreateStockTransferInput = { fromOutletUuid:string; toOutletUuid:string; notes?:string; items:TransferLineInput[] };
export type StockTransferSummary = { uuid:string; transferNo:string; fromOutletUuid:string; fromOutletName:string; toOutletUuid:string; toOutletName:string; status:"draft"|"sent"|"received"|"cancelled"; notes:string|null; createdAt:string; sentAt:string|null; receivedAt:string|null; itemCount:number };
export type MultiOutletDashboard = { outlets:OutletAdmin[]; balances:OutletBalance[]; transfers:StockTransferSummary[] };
