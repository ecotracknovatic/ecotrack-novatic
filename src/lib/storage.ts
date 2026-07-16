import { supabase } from "@/integrations/supabase/client";

const BUCKET = "tree-photos";

/**
 * Uploads a single batch-level reference photo and returns its public URL.
 * Per-tree individual photos are out of scope for bulk registration — see
 * the Photo Verification module for that.
 */
export async function uploadBatchPhoto(file: File, organizationId: string): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${organizationId}/batches/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
