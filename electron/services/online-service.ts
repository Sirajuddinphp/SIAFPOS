import type Database from "better-sqlite3";
import type { CreateOnlineOrderInput, GenerateQrTokenInput, OnlineChannel, OnlineDashboard, OnlineOrder, QrTableToken, SaveOnlineChannelInput, UpdateOnlineOrderStatusInput } from "../../shared/contracts/online-contracts";
import { OnlineRepository } from "../repositories/online-repository";
export class OnlineService{
 private readonly repo:OnlineRepository;
 constructor(db:Database.Database){this.repo=new OnlineRepository(db);}
 dashboard():OnlineDashboard{return this.repo.dashboard();}
 saveChannel(input:SaveOnlineChannelInput):OnlineChannel{return this.repo.saveChannel(input,new Date().toISOString());}
 generateQr(input:GenerateQrTokenInput):QrTableToken{return this.repo.generateToken(input,new Date().toISOString());}
 createOrder(input:CreateOnlineOrderInput):OnlineOrder{return this.repo.createOrder(input,new Date().toISOString());}
 updateStatus(input:UpdateOnlineOrderStatusInput):OnlineOrder{return this.repo.updateStatus(input,new Date().toISOString());}
}
