import type Database from "better-sqlite3";
import { ShiftRepository } from "../repositories/shift-repository";
export class ShiftError extends Error { constructor(public readonly code:string,message:string){super(message);} }
export class ShiftService {
  private readonly repo:ShiftRepository; constructor(db:Database.Database){this.repo=new ShiftRepository(db);}
  getOpen(terminalUuid:string){return this.repo.getOpen(terminalUuid);}
  open(terminalUuid:string,userUuid:string,openingCashMinor:number){ if(this.repo.getOpen(terminalUuid)) throw new ShiftError("SHIFT_ALREADY_OPEN","A shift is already open on this terminal."); return this.repo.open(terminalUuid,userUuid,openingCashMinor,new Date().toISOString()); }
  close(terminalUuid:string,actualCashMinor:number,note?:string){ const shift=this.repo.getOpen(terminalUuid); if(!shift) throw new ShiftError("NO_OPEN_SHIFT","Open a shift before closing."); const now=new Date().toISOString(); this.repo.close(shift.uuid,actualCashMinor,shift.expectedCashMinor,note??null,now); return this.repo.get(shift.uuid)!; }
}
