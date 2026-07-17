import { useRef } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useProjectDocuments,
  useUploadProjectDocument,
  useDeleteProjectDocument,
  getDocumentSignedUrl,
} from "@/hooks/projects/useProjectDocuments";

export function ProjectDocuments({ projectId }: { projectId: string }) {
  const documents = useProjectDocuments(projectId);
  const upload = useUploadProjectDocument();
  const deleteDoc = useDeleteProjectDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    upload.mutate(
      { projectId, file, docType: "" },
      {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast.success("Document uploaded");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  const handleOpen = async (storagePath: string) => {
    try {
      const url = await getDocumentSignedUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        disabled={upload.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Upload document
      </Button>
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelected(e.target.files?.[0])} />

      {documents.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      ) : documents.error ? (
        <p className="text-sm text-destructive">Couldn't load documents.</p>
      ) : !documents.data?.length ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {documents.data.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                onClick={() => handleOpen(doc.storage_path)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {doc.title}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => deleteDoc.mutate({ id: doc.id, storagePath: doc.storage_path, projectId })}
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
