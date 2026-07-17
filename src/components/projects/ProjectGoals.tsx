import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProjectGoals, useCreateGoal, useToggleGoalAchieved, useDeleteGoal } from "@/hooks/projects/useProjectGoals";
import type { ProjectGoal } from "@/types/project";

function GoalSection({ projectId, goalType, goals }: { projectId: string; goalType: "objective" | "outcome"; goals: ProjectGoal[] }) {
  const createGoal = useCreateGoal();
  const toggleAchieved = useToggleGoalAchieved();
  const deleteGoal = useDeleteGoal();
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    createGoal.mutate(
      { project_id: projectId, goal_type: goalType, description: text },
      {
        onSuccess: () => setText(""),
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium capitalize text-foreground">{goalType}s</p>
      <div className="flex gap-2">
        <Input
          placeholder={`Add an ${goalType}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button type="button" size="icon" onClick={handleAdd} disabled={createGoal.isPending} className="shrink-0">
          {createGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">None added yet.</p>
      ) : (
        <ul className="space-y-1">
          {goals.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={g.is_achieved}
                  onChange={(e) => toggleAchieved.mutate({ id: g.id, projectId, isAchieved: e.target.checked })}
                />
                <span className={g.is_achieved ? "text-muted-foreground line-through" : "text-foreground"}>
                  {g.description}
                </span>
              </label>
              <button type="button" onClick={() => deleteGoal.mutate({ id: g.id, projectId })}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProjectGoals({ projectId }: { projectId: string }) {
  const goals = useProjectGoals(projectId);

  if (goals.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (goals.error) return <p className="text-sm text-destructive">Couldn't load objectives/outcomes.</p>;

  const objectives = goals.data?.filter((g) => g.goal_type === "objective") ?? [];
  const outcomes = goals.data?.filter((g) => g.goal_type === "outcome") ?? [];

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <GoalSection projectId={projectId} goalType="objective" goals={objectives} />
      <GoalSection projectId={projectId} goalType="outcome" goals={outcomes} />
    </div>
  );
}
