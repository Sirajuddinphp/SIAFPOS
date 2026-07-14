import log from "electron-log";

log.transports.file.level = "info";
log.transports.console.level = process.env.NODE_ENV === "development" ? "debug" : "info";

export type LogCategory = "application" | "database" | "authentication" | "ipc" | "migration" | "security";

export const logger = {
  info(category: LogCategory, message: string, metadata?: unknown): void {
    log.info(formatMessage(category, message), metadata ?? "");
  },
  warn(category: LogCategory, message: string, metadata?: unknown): void {
    log.warn(formatMessage(category, message), metadata ?? "");
  },
  error(category: LogCategory, message: string, metadata?: unknown): void {
    log.error(formatMessage(category, message), metadata ?? "");
  },
  debug(category: LogCategory, message: string, metadata?: unknown): void {
    log.debug(formatMessage(category, message), metadata ?? "");
  }
};

function formatMessage(category: LogCategory, message: string): string {
  return `[${category}] ${message}`;
}
