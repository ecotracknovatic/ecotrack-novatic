const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
  planning: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  active: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  planning: "Planned",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-accent text-foreground";
  const label = STATUS_LABELS[status] ?? status;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${style}`}>{label}</span>;
}
