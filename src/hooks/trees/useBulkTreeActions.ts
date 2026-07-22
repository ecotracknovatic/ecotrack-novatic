import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

function invalidateTreeLists(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["trees"] });
  qc.invalidateQueries({ queryKey: ["tree_search"] });
  qc.invalidateQueries({ queryKey: ["trees_dashboard_stats"] });
  qc.invalidateQueries({ queryKey: ["trees_operations_dashboard_stats"] });
}

export function useBulkTreeHealthUpdate() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ treeIds, healthStatus, notes }: { treeIds: string[]; healthStatus: string; notes: string }) => {
      // One health_records row per tree — reuses the existing table/trigger
      // (each insert still fires the same sync + notification logic as a
      // single manual entry), just issued for N trees in one round trip.
      const { error } = await supabase.from("tree_health_records").insert(
        treeIds.map((tree_id) => ({
          tree_id,
          health_status: healthStatus,
          health_notes: notes || null,
          recorded_by: user?.id,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => invalidateTreeLists(qc),
  });
}

export function useBulkTreeMaintenance() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      treeIds,
      maintenanceType,
      maintenanceDate,
      responsiblePerson,
    }: {
      treeIds: string[];
      maintenanceType: string;
      maintenanceDate: string;
      responsiblePerson: string;
    }) => {
      const { error } = await supabase.from("tree_maintenance_records").insert(
        treeIds.map((tree_id) => ({
          tree_id,
          maintenance_type: maintenanceType,
          maintenance_date: maintenanceDate,
          responsible_person: responsiblePerson || null,
          recorded_by: user?.id,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => invalidateTreeLists(qc),
  });
}

export function useBulkTreeAssignment() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      treeIds,
      assignedToUserId,
      assignmentType,
    }: {
      treeIds: string[];
      assignedToUserId: string;
      assignmentType: string;
    }) => {
      // Close any open assignment per tree first, same rule as the
      // single-tree useAssignTree hook.
      const { error: closeError } = await supabase
        .from("tree_assignments")
        .update({ unassigned_at: new Date().toISOString() })
        .in("tree_id", treeIds)
        .is("unassigned_at", null);
      if (closeError) throw closeError;

      const { error } = await supabase.from("tree_assignments").insert(
        treeIds.map((tree_id) => ({
          tree_id,
          assigned_to_user_id: assignedToUserId,
          assignment_type: assignmentType,
          assigned_by: user?.id,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => invalidateTreeLists(qc),
  });
}

export function useBulkTreeStatusUpdate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ treeIds, survivalStatus }: { treeIds: string[]; survivalStatus: string }) => {
      const { error } = await supabase.from("trees").update({ survival_status: survivalStatus }).in("id", treeIds);
      if (error) throw error;
    },
    onSuccess: () => invalidateTreeLists(qc),
  });
}

// "Bulk archive" — trees has no archived flag of its own; survival_status
// already models a tree's lifecycle end-state, so archiving reuses it
// rather than adding a parallel is_archived column.
export function useBulkTreeArchive() {
  const statusUpdate = useBulkTreeStatusUpdate();
  return {
    ...statusUpdate,
    mutate: (treeIds: string[], options?: Parameters<typeof statusUpdate.mutate>[1]) =>
      statusUpdate.mutate({ treeIds, survivalStatus: "archived" }, options),
  };
}
