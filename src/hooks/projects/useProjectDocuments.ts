import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { ProjectDocument } from "@/types/project";

const BUCKET = "project-documents";

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ["project_documents", projectId],
    queryFn: async (): Promise<ProjectDocument[]> => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}

// project-documents is a private bucket (unlike tree-photos/event-photos),
// so downloads need a short-lived signed URL rather than a public URL.
export async function getDocumentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}

export function useUploadProjectDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, file, docType }: { projectId: string; file: File; docType: string }) => {
      const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("project_documents").insert({
        project_id: projectId,
        title: file.name,
        storage_path: path,
        doc_type: docType || null,
        uploaded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_documents", variables.projectId] }),
  });
}

export function useDeleteProjectDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string; projectId: string }) => {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      const { error } = await supabase.from("project_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => qc.invalidateQueries({ queryKey: ["project_documents", variables.projectId] }),
  });
}
