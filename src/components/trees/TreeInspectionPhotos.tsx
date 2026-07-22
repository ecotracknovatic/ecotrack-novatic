import { useTreePhotos } from "@/hooks/trees/useTreePhotos";

export function TreeInspectionPhotos({ treeId }: { treeId: string }) {
  const photos = useTreePhotos(treeId);

  const inspectionPhotos = (photos.data ?? []).filter((p) => p.photo_type === "monthly_monitoring");

  if (photos.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (inspectionPhotos.length === 0) {
    return <p className="text-sm text-muted-foreground">No inspection photos yet — add one when recording a visit.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {inspectionPhotos.map((photo) => (
        <img
          key={photo.id}
          src={photo.url}
          alt="Inspection photo"
          className="h-20 w-full rounded-lg border object-cover"
        />
      ))}
    </div>
  );
}
