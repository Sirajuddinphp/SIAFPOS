import type Database from "better-sqlite3";
import type { SalesReport } from "../../shared/contracts/report-contracts";
import { ReportRepository } from "../repositories/report-repository";
export class ReportService {
  private readonly reports: ReportRepository;
  constructor(db: Database.Database) { this.reports = new ReportRepository(db); }
  sales(from: string, to: string): SalesReport { return this.reports.sales(from, to); }
}
