export type DiningTableStatus = "available" | "occupied" | "held";

export type DiningTableSummary = {
  uuid: string;
  name: string;
  floor: string;
  capacity: number;
  status: DiningTableStatus;
  sortOrder: number;
  activeOrderUuid: string | null;
};

export type WaiterSummary = {
  uuid: string;
  name: string;
  code: string;
  status: "active" | "inactive";
};

export type FloorMap = {
  floors: string[];
  tables: DiningTableSummary[];
};
