import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { EnterpriseDashboard } from "../../../shared/contracts/enterprise-contracts";
import { Button } from "../../components/ui/Button";
import { requirePosApi } from "../../utils/pos-api";

export function EnterpriseScreen() {
  const [data,setData]=useState<EnterpriseDashboard|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [licenseKey,setLicenseKey]=useState("");
  const [plan,setPlan]=useState("pro");
  const [deviceName,setDeviceName]=useState("Counter Device");
  const [fingerprint,setFingerprint]=useState(`device-${navigator.platform}-${navigator.language}`);
  const [keyName,setKeyName]=useState("Integration API");
  const [newSecret,setNewSecret]=useState<string|null>(null);

  const load=async()=>{const r=await requirePosApi().enterprise.dashboard();if(r.success){setData(r.data);setError(null);}else setError(r.error.message);};
  useEffect(()=>{void load();},[]);
  const run=async(fn:()=>Promise<{success:boolean;error?:{message:string}}>)=>{setBusy(true);try{const r=await fn();if(!r.success)setError(r.error?.message??"Operation failed");else await load();}finally{setBusy(false);}};
  const activate=()=>run(()=>requirePosApi().enterprise.activateLicense({licenseKey,planCode:plan,maxOutlets:10,maxTerminals:50,expiresAt:null}));
  const device=()=>run(()=>requirePosApi().enterprise.registerDevice({deviceName,deviceFingerprint:fingerprint,platform:navigator.platform,appVersion:null,terminalUuid:null}));
  const createKey=async()=>{setBusy(true);try{const r=await requirePosApi().enterprise.createApiKey({name:keyName,scopes:["orders:read","reports:read"],expiresAt:null});if(r.success){setNewSecret(r.data.secret??null);await load();}else setError(r.error.message);}finally{setBusy(false);}};

  return <div className="space-y-4">
    <div><h1 className="text-2xl font-extrabold">Enterprise & SaaS</h1><p className="text-sm text-app-subtle">License, devices, API access and local backups.</p></div>
    {error&&<div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 xl:grid-cols-4">
      <Card label="License" value={data?.license?.status??"Not configured"}/><Card label="Active devices" value={String(data?.summary.activeDevices??0)}/><Card label="Active API keys" value={String(data?.summary.activeApiKeys??0)}/><Card label="Ready backups" value={String(data?.summary.readyBackups??0)}/>
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <Section title="License activation"><Input value={licenseKey} onChange={setLicenseKey} placeholder="License key"/><Input value={plan} onChange={setPlan} placeholder="Plan code"/><Button disabled={busy||licenseKey.length<8} onClick={()=>void activate()}>Activate License</Button>{data?.license&&<p className="text-xs text-app-subtle">{data.license.licenseKeyPrefix}… · {data.license.planCode} · {data.license.maxOutlets} outlets · {data.license.maxTerminals} terminals</p>}</Section>
      <Section title="Register this device"><Input value={deviceName} onChange={setDeviceName} placeholder="Device name"/><Input value={fingerprint} onChange={setFingerprint} placeholder="Device fingerprint"/><Button disabled={busy||fingerprint.length<8} onClick={()=>void device()}>Register Device</Button></Section>
      <Section title="API keys"><Input value={keyName} onChange={setKeyName} placeholder="Key name"/><Button disabled={busy} onClick={()=>void createKey()}>Create API Key</Button>{newSecret&&<div className="rounded bg-amber-50 p-2 text-xs break-all"><b>Copy once:</b> {newSecret}</div>}<div className="space-y-2">{data?.apiKeys.map(k=><div key={k.uuid} className="flex justify-between rounded border p-2 text-sm"><span>{k.name} · {k.keyPrefix}…</span><Button variant="danger" className="h-8 px-2" onClick={()=>void run(()=>requirePosApi().enterprise.revokeApiKey({uuid:k.uuid}))}>Revoke</Button></div>)}</div></Section>
      <Section title="Database backups"><Button disabled={busy} onClick={()=>void run(()=>requirePosApi().enterprise.createBackup())}>Create Backup</Button><div className="max-h-64 space-y-2 overflow-y-auto">{data?.backups.map(b=><div key={b.uuid} className="rounded border p-2 text-xs"><div className="font-bold">{b.fileName}</div><div>{b.status} · {(b.sizeBytes/1024).toFixed(1)} KB</div>{b.status==="ready"&&<Button variant="secondary" className="mt-2 h-8 px-2" onClick={()=>void run(()=>requirePosApi().enterprise.requestRestore({uuid:b.uuid}))}>Request Restore</Button>}</div>)}</div></Section>
    </div>
    <Section title="Registered devices"><div className="grid gap-2 md:grid-cols-2">{data?.devices.map(d=><div key={d.uuid} className="flex items-center justify-between rounded border p-3 text-sm"><div><div className="font-bold">{d.deviceName}</div><div className="text-xs text-app-subtle">{d.platform} · {d.status}</div></div>{d.status==="active"&&<Button variant="danger" className="h-8 px-2" onClick={()=>void run(()=>requirePosApi().enterprise.revokeDevice({uuid:d.uuid}))}>Revoke</Button>}</div>)}</div></Section>
  </div>;
}
function Card({label,value}:{label:string;value:string}){return <div className="rounded-lg border bg-white p-4"><div className="text-xs text-app-subtle">{label}</div><div className="mt-1 text-xl font-extrabold">{value}</div></div>}
function Section({title,children}:{title:string;children:ReactNode}){return <section className="space-y-3 rounded-lg border bg-white p-4"><h2 className="font-extrabold">{title}</h2>{children}</section>}
function Input({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder:string}){return <input className="h-10 w-full rounded-md border px-3 text-sm" value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}
