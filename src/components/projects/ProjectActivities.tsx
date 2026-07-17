import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useProjectActivities,
  useCreateActivity,
  useUpdateActivityStatus,
  useDeleteActivity,
} from "@/hooks/projects/useProjectActivities";
import { ACTIVITY_STATUS_OPTIONS } from "@/types/project";

export function ProjectActivities({ projectId }: { projectId: string }) {
  const activities = useProjectActivities(projectId);
  const createActivity = useCreateActivity();
  const updateStatus = useUpdateActivityStatus();
  const deleteActivity = useDeleteActivity();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error("Enter an activity title");
      return;
    }
    createActivity.mutate(
      { project_id: projectId, title, description: "", activity_date: date },
      { onSuccess: () => setTitle(""), onError: (error: Error) => toast.error(error.message) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Activity title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-40" />
        <Button type="button" onClick={handleAdd} disabled={createActivity.isPending} className="gap-1.5 shrink-0">
          {createActivity.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>

      {activities.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activities…</p>
      ) : activities.error ? (
        <p className="text-sm text-destructive">Couldn't load activities.</p>
      ) : !activities.data?.length ? (
        <p className="text-sm text-muted-foreground">No activities logged yet.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {activities.data.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.activity_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={a.status}
                  onValueChange={(status) =>
                    updateStatus.mutate(
                      { id: a.id, projectId, status },
                      { onError: (error: Error) => toast.error(error.message) },
                    )
                  }
                >
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteActivity.mutate({ id: a.id, projectId })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
