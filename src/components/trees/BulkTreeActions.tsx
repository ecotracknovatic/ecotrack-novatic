import { toast } from "sonner";
import { Loader2, X, HeartPulse, Wrench, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBulkTreeHealthUpdate,
  useBulkTreeMaintenance,
  useBulkTreeArchive,
} from "@/hooks/trees/useBulkTreeActions";
import { HEALTH_STATUS_OPTIONS, MAINTENANCE_TYPE_OPTIONS } from "@/types/treeDetail";

interface BulkTreeActionsProps {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkTreeActions({ selectedIds, onClear }: BulkTreeActionsProps) {
  const bulkHealth = useBulkTreeHealthUpdate();
  const bulkMaintenance = useBulkTreeMaintenance();
  const bulkArchive = useBulkTreeArchive();

  if (selectedIds.length === 0) return null;

  const isBusy = bulkHealth.isPending || bulkMaintenance.isPending || bulkArchive.isPending;

  const applyHealth = (status: string) => {
    bulkHealth.mutate(
      { treeIds: selectedIds, healthStatus: status, notes: "Bulk update" },
      {
        onSuccess: () => {
          toast.success(`${selectedIds.length} tree(s) updated`);
          onClear();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const applyMaintenance = (type: string) => {
    bulkMaintenance.mutate(
      { treeIds: selectedIds, maintenanceType: type, maintenanceDate: new Date().toISOString().slice(0, 10), responsiblePerson: "" },
      {
        onSuccess: () => {
          toast.success(`Logged for ${selectedIds.length} tree(s)`);
          onClear();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const applyArchive = () => {
    bulkArchive.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} tree(s) archived`);
        onClear();
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-accent/50 px-4 py-2.5">
      <p className="text-sm font-medium text-foreground">{selectedIds.length} selected</p>
      <div className="flex flex-wrap items-center gap-2">
        <Select onValueChange={applyHealth} disabled={isBusy}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <HeartPulse className="mr-1 h-3.5 w-3.5" />
            <SelectValue placeholder="Set health…" />
          </SelectTrigger>
          <SelectContent>
            {HEALTH_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={applyMaintenance} disabled={isBusy}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <Wrench className="mr-1 h-3.5 w-3.5" />
            <SelectValue placeholder="Log maintenance…" />
          </SelectTrigger>
          <SelectContent>
            {MAINTENANCE_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={applyArchive} disabled={isBusy}>
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
          Archive
        </Button>

        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
