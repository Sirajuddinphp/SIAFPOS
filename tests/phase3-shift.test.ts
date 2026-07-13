import { describe, expect, it, vi } from "vitest";
import { ShiftService } from "../electron/services/shift-service";
import { createMigratedTestDatabase, seedAuthFixture } from "./test-helpers";
vi.mock("electron",()=>({app:{isPackaged:false,getPath:()=>process.cwd(),getVersion:()=>"0.1.0"}}));
describe("shift service",()=>{it("opens and closes a shift",()=>{const db=createMigratedTestDatabase();const f=seedAuthFixture(db);const service=new ShiftService(db);const opened=service.open(f.terminal.uuid,f.user.uuid,200000);expect(opened.status).toBe("open");const closed=service.close(f.terminal.uuid,199500,"short by five");expect(closed.status).toBe("closed");expect(closed.differenceMinor).toBe(-500);db.close();});});
