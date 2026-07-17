import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react";
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
  useProjectMilestones,
  useCreateMilestone,
  useUpdateMilestoneStatus,
  useDeleteMilestone,
} from "@/hooks/projects/useProjectMilestones";
import { MILESTONE_STATUS_OPTIONS } from "@/types/project";

export function ProjectMilestones({ projectId }: { projectId: string }) {
  const milestones = useProjectMilestones(projectId);
  const createMilestone = useCreateMilestone();
  const updateStatus = useUpdateMilestoneStatus();
  const deleteMilestone = useDeleteMilestone();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error("Enter a milestone title");
      return;
    }
    createMilestone.mutate(
      {
        project_id: projectId,
        title,
        description: "",
        due_date: dueDate,
        order_index: milestones.data?.length ?? 0,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDueDate("");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Milestone title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="sm:w-40" />
        <Button type="button" onClick={handleAdd} disabled={createMilestone.isPending} className="gap-1.5 shrink-0">
          {createMilestone.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>

      {milestones.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading milestones…</p>
      ) : milestones.error ? (
        <p className="text-sm text-destructive">Couldn't load milestones.</p>
      ) : !milestones.data?.length ? (
        <p className="text-sm text-muted-foreground">No milestones yet.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {milestones.data.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div className="flex items-center gap-2">
                {m.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className={`text-sm font-medium ${m.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {m.title}
                  </p>
                  {m.due_date && <p className="text-xs text-muted-foreground">Due {m.due_date}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={m.status}
                  onValueChange={(status) =>
                    updateStatus.mutate(
                      { id: m.id, projectId, status },
                      { onError: (error: Error) => toast.error(error.message) },
                    )
                  }
                >
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MILESTONE_STATUS_OPTIONS.map((s) => (
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
                  onClick={() => deleteMilestone.mutate({ id: m.id, projectId })}
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
