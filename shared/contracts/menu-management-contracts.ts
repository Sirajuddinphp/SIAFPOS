import type { GstPricingMode, ModifierGroup, ProductVariant } from "./catalog-contracts";

export type MenuCategoryAdmin = { uuid:string; name:string; code:string; sortOrder:number; isActive:boolean; productCount:number };
export type MenuProductAdmin = { uuid:string; categoryUuid:string; categoryName:string; name:string; description:string|null; sku:string|null; barcode:string|null; basePriceMinor:number; gstMode:GstPricingMode; gstRateBasisPoints:number; kitchenStation:string; isOnlineVisible:boolean; isFavorite:boolean; imageUrl:string|null; isActive:boolean; sortOrder:number; variants:ProductVariant[]; modifierGroups:ModifierGroup[] };
export type MenuDashboard = { categories:MenuCategoryAdmin[]; products:MenuProductAdmin[]; modifierGroups:ModifierGroup[]; kitchenStations:string[] };
export type SaveMenuCategoryInput = { categoryUuid?:string; name:string; code:string; sortOrder:number; isActive?:boolean };
export type SaveMenuProductInput = { productUuid?:string; categoryUuid:string; name:string; description?:string; sku?:string; barcode?:string; basePriceMinor:number; gstMode:GstPricingMode; gstRateBasisPoints:number; kitchenStation:string; isOnlineVisible?:boolean; isFavorite?:boolean; imageUrl?:string; isActive?:boolean; sortOrder:number };
export type SaveProductVariantInput = { variantUuid?:string; productUuid:string; name:string; sku?:string; barcode?:string; priceMinor:number; isDefault?:boolean; isActive?:boolean };
export type SaveModifierGroupInput = { groupUuid?:string; name:string; code:string; minSelect:number; maxSelect:number; isRequired?:boolean; isActive?:boolean };
export type SaveModifierInput = { modifierUuid?:string; groupUuid:string; name:string; code:string; priceDeltaMinor:number; isActive?:boolean };
export type AssignModifierGroupInput = { productUuid:string; groupUuid:string; assigned:boolean };
