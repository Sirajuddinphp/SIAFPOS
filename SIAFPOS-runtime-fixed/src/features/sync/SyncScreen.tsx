import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { useSyncStore } from "../../stores/sync-store";

export function SyncScreen() {
  const { status, lastResult, loading, error, refresh, configure, process, retryFailed } = useSyncStore();
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (status?.apiUrl) setApiUrl(status.apiUrl); }, [status?.apiUrl]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const saved = await configure({ apiUrl, ...(apiToken ? { apiToken } : {}) });
    if (saved) setApiToken("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Cloud Sync</h1>
        <p className="text-sm text-app-subtle">Offline outbox, retry and Laravel API delivery.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Pending" value={status?.pendingCount ?? 0} />
        <Metric label="Failed" value={status?.failedCount ?? 0} />
        <Metric label="Conflicts" value={status?.conflictCount ?? 0} />
      </div>

      <section className="rounded-lg border border-app-border bg-white p-4">
        <h2 className="font-bold">Cloud API configuration</h2>
        <form className="mt-3 grid gap-3" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-semibold">
            Laravel API URL
            <input className="h-11 rounded-md border border-app-border px-3 font-normal" placeholder="https://example.com" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            API token
            <input className="h-11 rounded-md border border-app-border px-3 font-normal" type="password" placeholder="Leave blank to keep current token" value={apiToken} onChange={(event) => setApiToken(event.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={loading}>Save</Button>
            <Button type="button" variant="secondary" disabled={loading || !status?.configured} onClick={() => void process()}>Sync Now</Button>
            <Button type="button" variant="secondary" disabled={loading || !(status?.failedCount)} onClick={() => void retryFailed()}>Retry Failed</Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-app-border bg-white p-4 text-sm">
        <div className="grid gap-2 md:grid-cols-2">
          <Info label="Configured" value={status?.configured ? "Yes" : "No"} />
          <Info label="Last push" value={status?.lastPushAt ?? "Never"} />
          <Info label="Last pull" value={status?.lastPullAt ?? "Not implemented yet"} />
          <Info label="Last error" value={status?.lastError ?? "None"} />
        </div>
        {lastResult && <div className="mt-3 rounded-md bg-app-muted p-3">Attempted {lastResult.attempted}, synced {lastResult.synced}, failed {lastResult.failed}{lastResult.message ? ` — ${lastResult.message}` : ""}</div>}
        {error && <div className="mt-3 text-red-700">{error}</div>}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-app-border bg-white p-4"><div className="text-xs font-bold uppercase text-app-subtle">{label}</div><div className="mt-1 text-3xl font-extrabold">{value}</div></div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><span className="font-bold">{label}:</span> <span className="text-app-subtle">{value}</span></div>;
}
