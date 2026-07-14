import type Database from "better-sqlite3";
import type { CustomerSummary, SaveCustomerInput } from "../../shared/contracts/customer-contracts";
import { CustomerRepository } from "../repositories/customer-repository";
export class CustomerService {
  private readonly customers:CustomerRepository;
  constructor(db:Database.Database){this.customers=new CustomerRepository(db);}
  search(query:string,limit:number):CustomerSummary[]{return this.customers.search(query,limit);}
  listRecent(limit=25):CustomerSummary[]{return this.customers.listRecent(limit);}
  save(input:SaveCustomerInput):CustomerSummary{return this.customers.save(input,new Date().toISOString());}
  setActive(uuid:string,isActive:boolean):CustomerSummary{return this.customers.setActive(uuid,isActive,new Date().toISOString());}
}
