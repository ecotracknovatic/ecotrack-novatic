import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectProgress } from "@/hooks/projects/useProjectProgress";
import {
  useProjectBudgetEntries,
  useProjectFundingSources,
  useCreateBudgetEntry,
  useCreateFundingSource,
} from "@/hooks/projects/useProjectBudget";

export function ProjectBudget({ projectId }: { projectId: string }) {
  const progress = useProjectProgress(projectId);
  const entries = useProjectBudgetEntries(projectId);
  const funding = useProjectFundingSources(projectId);
  const createEntry = useCreateBudgetEntry();
  const createFunding = useCreateFundingSource();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"expense" | "income">("expense");
  const [fundingSource, setFundingSource] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");

  const budgetTotal = progress.data?.budgetTotal ?? 0;
  const budgetSpent = progress.data?.budgetSpent ?? 0;
  const utilizationPct = budgetTotal > 0 ? Math.min(100, Math.round((budgetSpent / budgetTotal) * 100)) : 0;
  const isOverBudget = budgetTotal > 0 && budgetSpent > budgetTotal;

  const handleAddEntry = () => {
    const parsedAmount = Number(amount);
    if (!category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a category and a valid amount");
      return;
    }
    createEntry.mutate(
      {
        project_id: projectId,
        category,
        description: "",
        amount: parsedAmount,
        entry_type: entryType,
        entry_date: new Date().toISOString().slice(0, 10),
      },
      {
        onSuccess: () => {
          setCategory("");
          setAmount("");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const handleAddFunding = () => {
    const parsedAmount = Number(fundingAmount);
    if (!fundingSource.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a source name and a valid amount");
      return;
    }
    createFunding.mutate(
      {
        project_id: projectId,
        source_name: fundingSource,
        amount: parsedAmount,
        received_date: new Date().toISOString().slice(0, 10),
        notes: "",
      },
      {
        onSuccess: () => {
          setFundingSource("");
          setFundingAmount("");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Budget utilization</span>
          <span className={isOverBudget ? "font-medium text-destructive" : "font-medium text-foreground"}>
            {budgetSpent.toLocaleString()} / {budgetTotal.toLocaleString()} ({utilizationPct}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${isOverBudget ? "bg-destructive" : "bg-emerald-600"}`}
            style={{ width: `${Math.min(100, utilizationPct)}%` }}
          />
        </div>
        {isOverBudget && <p className="text-xs text-destructive">Over budget.</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Budget entries</p>
          <div className="flex gap-2">
            <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1" />
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24"
            />
            <Select value={entryType} onValueChange={(v) => setEntryType(v as "expense" | "income")}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" size="icon" onClick={handleAddEntry} disabled={createEntry.isPending} className="shrink-0">
              {createEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          {entries.data?.length ? (
            <ul className="divide-y rounded-lg border text-sm">
              {entries.data.map((e) => (
                <li key={e.id} className="flex justify-between px-3 py-1.5">
                  <span>{e.category}</span>
                  <span className={e.entry_type === "expense" ? "text-destructive" : "text-emerald-600"}>
                    {e.entry_type === "expense" ? "-" : "+"}
                    {e.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Funding sources</p>
          <div className="flex gap-2">
            <Input
              placeholder="Source name"
              value={fundingSource}
              onChange={(e) => setFundingSource(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Amount"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              className="w-24"
            />
            <Button type="button" size="icon" onClick={handleAddFunding} disabled={createFunding.isPending} className="shrink-0">
              {createFunding.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          {funding.data?.length ? (
            <ul className="divide-y rounded-lg border text-sm">
              {funding.data.map((f) => (
                <li key={f.id} className="flex justify-between px-3 py-1.5">
                  <span>{f.source_name}</span>
                  <span className="text-emerald-600">+{f.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No funding recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
