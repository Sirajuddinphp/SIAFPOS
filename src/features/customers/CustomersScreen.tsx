import { useEffect, useState } from "react";
import type { CustomerSummary, SaveCustomerInput } from "../../../shared/contracts/customer-contracts";
import { Button } from "../../components/ui/Button";
import { requirePosApi } from "../../utils/pos-api";

const emptyForm: SaveCustomerInput = { name:"", phone:"", email:"", addressSummary:"", isActive:true };
export function CustomersScreen(){
 const [query,setQuery]=useState(""); const [items,setItems]=useState<CustomerSummary[]>([]); const [form,setForm]=useState<SaveCustomerInput>(emptyForm); const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false);
 const load=async()=>{setBusy(true);const r=await requirePosApi().customers.search({query,limit:100});setBusy(false);if(r.success){setItems(r.data);setError(null);}else setError(r.error.message);};
 useEffect(()=>{void load();},[]);
 const edit=(c:CustomerSummary)=>setForm({customerUuid:c.uuid,name:c.name,phone:c.phone??"",email:c.email??"",addressSummary:c.addressSummary??"",isActive:c.isActive});
 const save=async()=>{setBusy(true);const r=await requirePosApi().customers.save(form);setBusy(false);if(r.success){setForm(emptyForm);await load();}else setError(r.error.message);};
 const toggle=async(c:CustomerSummary)=>{const r=await requirePosApi().customers.setActive({customerUuid:c.uuid,isActive:!c.isActive});if(r.success)await load();else setError(r.error.message);};
 return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
  <section className="rounded-lg border border-app-border bg-white">
   <div className="flex items-center gap-2 border-b border-app-border p-4"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void load();}} placeholder="Search name, phone or email" className="h-11 flex-1 rounded-md border border-app-border px-3"/><Button onClick={()=>void load()}>Search</Button></div>
   {error&&<div className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
   <div className="divide-y divide-app-border">
    {items.map(c=><div key={c.uuid} className="flex items-center justify-between gap-3 p-4"><div><div className="font-bold">{c.name}</div><div className="text-sm text-app-subtle">{c.phone||"No phone"} · {c.email||"No email"}</div><div className="text-xs text-app-subtle">{c.addressSummary||"No address"}</div></div><div className="flex gap-2"><Button variant="secondary" onClick={()=>edit(c)}>Edit</Button><Button variant={c.isActive?"danger":"secondary"} onClick={()=>void toggle(c)}>{c.isActive?"Deactivate":"Activate"}</Button></div></div>)}
    {!busy&&!items.length&&<div className="p-8 text-center text-app-subtle">No customers found.</div>}
   </div>
  </section>
  <section className="h-fit rounded-lg border border-app-border bg-white p-4"><h2 className="text-lg font-extrabold">{form.customerUuid?"Edit Customer":"New Customer"}</h2><div className="mt-4 space-y-3">
   <Field label="Name" value={form.name} onChange={v=>setForm({...form,name:v})}/><Field label="Phone" value={form.phone??""} onChange={v=>setForm({...form,phone:v})}/><Field label="Email" value={form.email??""} onChange={v=>setForm({...form,email:v})}/><Field label="Address" value={form.addressSummary??""} onChange={v=>setForm({...form,addressSummary:v})}/>
   <div className="flex gap-2"><Button disabled={busy||form.name.trim().length<2} onClick={()=>void save()}>Save Customer</Button>{form.customerUuid&&<Button variant="secondary" onClick={()=>setForm(emptyForm)}>Cancel</Button>}</div>
  </div></section>
 </div>;
}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="block text-sm font-semibold">{label}<input value={value} onChange={e=>onChange(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-app-border px-3 font-normal"/></label>;}
