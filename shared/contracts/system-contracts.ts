export type AppInfo = {
  name: string;
  version: string;
  environment: "development" | "production" | "test";
};

export type HealthState = "ok" | "warning" | "error";

export type HealthCheckItem = {
  name: string;
  status: HealthState;
  message: string;
};

export type SystemHealth = {
  status: HealthState;
  app: HealthCheckItem;
  database: HealthCheckItem;
  migrations: HealthCheckItem;
  terminal: HealthCheckItem;
  renderer: HealthCheckItem;
  checkedAt: string;
};

export type ConnectivityStatus = {
  isOnline: boolean;
  checkedAt: string;
};

export type DatabaseHealth = {
  status: HealthState;
  databasePathAvailable: boolean;
  connectionOpen: boolean;
  walEnabled: boolean;
  foreignKeysEnabled: boolean;
  busyTimeoutMs: number;
  requiredTablesPresent: boolean;
  message: string;
  checkedAt: string;
};

export type DatabaseVersion = {
  latestMigration: string | null;
  appliedCount: number;
};
