import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProjectTeam, useAssignTeamMember, useRemoveTeamMember } from "@/hooks/projects/useProjectTeam";

export function ProjectTeam({ projectId }: { projectId: string }) {
  const team = useProjectTeam(projectId);
  const assign = useAssignTeamMember();
  const remove = useRemoveTeamMember();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const handleAssign = () => {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    assign.mutate(
      { projectId, email, role },
      {
        onSuccess: () => {
          setEmail("");
          setRole("");
          toast.success("Team member added");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
        <Input placeholder="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-40" />
        <Button type="button" onClick={handleAssign} disabled={assign.isPending} className="gap-1.5 shrink-0">
          {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Add
        </Button>
      </div>

      {team.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading team…</p>
      ) : team.error ? (
        <p className="text-sm text-destructive">Couldn't load the team.</p>
      ) : !team.data?.length ? (
        <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {team.data.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.profiles?.full_name || member.profiles?.email || "Unknown user"}
                </p>
                {member.role_on_project && <p className="text-xs text-muted-foreground">{member.role_on_project}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => remove.mutate({ id: member.id, projectId })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
