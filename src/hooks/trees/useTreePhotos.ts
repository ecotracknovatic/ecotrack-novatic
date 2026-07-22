import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { TreePhoto } from "@/types/treeDetail";

const BUCKET = "tree-photos"; // created in the Bulk Tree Registration migration — reused, not recreated

export function useTreePhotos(treeId: string) {
  return useQuery({
    queryKey: ["tree_photos", treeId],
    queryFn: async (): Promise<TreePhoto[]> => {
      const { data, error } = await supabase
        .from("tree_photos")
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!treeId,
  });
}

interface UploadTreePhotoFileInput {
  treeId: string;
  file: File;
  caption: string;
  photoType: string;
  visitId?: string;
  uploadedBy?: string;
}

// Extracted so useRecordMonitoringVisit can reuse the exact same
// upload+insert logic (tagged with a visit_id) instead of duplicating it.
export async function uploadTreePhotoFile(input: UploadTreePhotoFileInput): Promise<void> {
  const extension = input.file.name.split(".").pop() ?? "jpg";
  const path = `${input.treeId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file);
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error } = await supabase.from("tree_photos").insert({
    tree_id: input.treeId,
    url: publicUrl.publicUrl,
    caption: input.caption || null,
    photo_type: input.photoType || null,
    visit_id: input.visitId ?? null,
    uploaded_by: input.uploadedBy,
  });
  if (error) throw error;
}

export function useUploadTreePhoto() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ treeId, file, caption, photoType }: { treeId: string; file: File; caption: string; photoType: string }) => {
      await uploadTreePhotoFile({ treeId, file, caption, photoType, uploadedBy: user?.id });
    },
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ["tree_photos", variables.treeId] });
      qc.invalidateQueries({ queryKey: ["tree_details", variables.treeId] });
    },
  });
}

export function useDeleteTreePhoto() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId }: { photoId: string; treeId: string }) => {
      const { error } = await supabase.from("tree_photos").delete().eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ["tree_photos", variables.treeId] });
      qc.invalidateQueries({ queryKey: ["tree_details", variables.treeId] });
    },
  });
}
