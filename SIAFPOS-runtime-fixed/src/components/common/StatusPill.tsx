type StatusTone = "ok" | "warning" | "error" | "muted";

type StatusPillProps = {
  label: string;
  tone: StatusTone;
};

export function StatusPill({ label, tone }: StatusPillProps) {
  const styles: Record<StatusTone, string> = {
    ok: "border-green-200 bg-green-50 text-green-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
    muted: "border-app-border bg-app-muted text-app-subtle"
  };

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{label}</span>;
}
