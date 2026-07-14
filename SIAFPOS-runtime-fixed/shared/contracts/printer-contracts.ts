export type PrinterConnectionType = "mock" | "lan" | "usb";
export type PrinterRole = "receipt" | "kitchen" | "bar" | "cashier";
export type PrintJobStatus = "pending" | "printed" | "failed";
export type PrinterProfile = {
  uuid: string; name: string; role: PrinterRole; connectionType: PrinterConnectionType;
  host: string | null; port: number | null; devicePath: string | null;
  paperWidthMm: 58 | 80; charactersPerLine: number; autoCut: boolean;
  openCashDrawer: boolean; isDefault: boolean; isActive: boolean;
  createdAt: string; updatedAt: string;
};
export type SavePrinterInput = Omit<PrinterProfile,"uuid"|"createdAt"|"updatedAt"> & { uuid?: string };
export type PrinterRefInput = { printerUuid: string };
export type PrintJobSummary = {
  uuid:string; documentType:"receipt"|"kot"; documentUuid:string; printerUuid:string|null;
  printerName:string|null; status:PrintJobStatus; copyType:"original"|"duplicate";
  jobKind:"print"|"test"|"drawer"; attempts:number; errorMessage:string|null;
  createdAt:string; printedAt:string|null; cancelledAt:string|null;
};
export type PrinterDiagnostics = { printer:PrinterProfile; reachable:boolean; message:string; checkedAt:string };
export type QueueKotPrintInput = { kotUuid:string; printerUuid?:string };
export type RetryPrintJobInput = { printJobUuid:string };
export type PrinterRoute = { uuid:string; documentType:"receipt"|"kot"; categoryUuid:string|null; printerUuid:string; priority:number };
export type SavePrinterRouteInput = Omit<PrinterRoute,"uuid"> & { uuid?:string };
