import type Database from "better-sqlite3";
import type { AdjustLoyaltyInput, CrmDashboard, LoyaltyAccount, Membership, SaveCouponInput, SaveMembershipInput, Coupon } from "../../shared/contracts/crm-contracts";
import { CrmRepository } from "../repositories/crm-repository";
export class CrmService{
 private readonly repo:CrmRepository;
 constructor(db:Database.Database){this.repo=new CrmRepository(db);}
 dashboard():CrmDashboard{return this.repo.dashboard();}
 adjust(input:AdjustLoyaltyInput,userUuid:string|null):LoyaltyAccount{return this.repo.adjust(input,userUuid,new Date().toISOString());}
 saveCoupon(input:SaveCouponInput):Coupon{return this.repo.saveCoupon(input,new Date().toISOString());}
 saveMembership(input:SaveMembershipInput):Membership{return this.repo.saveMembership(input,new Date().toISOString());}
}
