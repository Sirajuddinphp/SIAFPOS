export type FinanceAccountType = "cash" | "bank" | "expense" | "income" | "supplier" | "customer" | "tax" | "equity";
export type FinanceEntryType = "expense" | "income" | "supplier_payment" | "customer_receipt" | "journal";
export type FinanceAccount = { uuid:string; name:string; accountType:FinanceAccountType; openingBalanceMinor:number; isActive:boolean; createdAt:string; updatedAt:string };
export type FinanceEntry = { uuid:string; entryDate:string; entryType:FinanceEntryType; accountUuid:string; accountName:string; counterAccountUuid:string|null; amountMinor:number; description:string; paymentMode:string; createdAt:string };
export type SaveFinanceAccountInput = { uuid?:string; name:string; accountType:FinanceAccountType; openingBalanceMinor?:number; isActive?:boolean };
export type CreateFinanceEntryInput = { entryDate:string; entryType:FinanceEntryType; accountUuid:string; counterAccountUuid?:string|null; amountMinor:number; description:string; paymentMode?:string; referenceType?:string|null; referenceUuid?:string|null };
export type FinanceDashboard = { accounts:FinanceAccount[]; recentEntries:FinanceEntry[]; summary:{ incomeMinor:number; expenseMinor:number; supplierPaymentsMinor:number; customerReceiptsMinor:number; netProfitMinor:number; cashBookMinor:number } };
