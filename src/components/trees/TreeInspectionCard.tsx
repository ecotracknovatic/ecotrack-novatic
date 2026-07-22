import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ClipboardCheck, ImagePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecordMonitoringVisit } from "@/hooks/trees/useRecordMonitoringVisit";
import { HEALTH_STATUS_OPTIONS } from "@/types/treeDetail";

function numberOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function TreeInspectionCard({ treeId }: { treeId: string }) {
  const recordVisit = useRecordMonitoringVisit();
  const [showForm, setShowForm] = useState(false);

  const [healthStatus, setHealthStatus] = useState("healthy");
  const [weather, setWeather] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [height, setHeight] = useState("");
  const [diameter, setDiameter] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [useGps, setUseGps] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not available on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setUseGps(true);
      },
      () => toast.error("Couldn't get GPS location"),
    );
  };

  const reset = () => {
    setShowForm(false);
    setWeather("");
    setNotes("");
    setRecommendations("");
    setHeight("");
    setDiameter("");
    setPhotos([]);
    setUseGps(false);
    setLatitude(null);
    setLongitude(null);
  };

  const handleSubmit = () => {
    recordVisit.mutate(
      {
        tree_id: treeId,
        visit_date: new Date().toISOString().slice(0, 10),
        latitude,
        longitude,
        weather_notes: weather,
        notes,
        recommendations,
        health_status: healthStatus,
        health_notes: "",
        disease_symptoms: "",
        recommended_actions: recommendations,
        height_cm: numberOrNull(height),
        diameter_cm: numberOrNull(diameter),
        canopy_width_m: null,
        stem_diameter_cm: null,
        age_years: null,
        photos,
      },
      {
        onSuccess: () => {
          reset();
          toast.success("Monitoring visit recorded");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Record a visit</CardTitle>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setShowForm((s) => !s)}>
          <ClipboardCheck className="h-3.5 w-3.5" />
          {showForm ? "Cancel" : "New visit"}
        </Button>
      </CardHeader>

      {showForm && (
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Select value={healthStatus} onValueChange={setHealthStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Height (cm)" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
            <Input placeholder="Diameter (cm)" type="number" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
          </div>

          <Input placeholder="Weather conditions" value={weather} onChange={(e) => setWeather(e.target.value)} />
          <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <Textarea
            placeholder="Recommendations"
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            rows={2}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={captureGps}>
              {useGps ? "GPS captured ✓" : "Capture GPS"}
            </Button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm hover:bg-accent">
              <ImagePlus className="h-3.5 w-3.5" />
              {photos.length > 0 ? `${photos.length} photo(s)` : "Add photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
              />
            </label>
          </div>

          <div className="rounded-lg border border-dashed p-2 text-xs text-muted-foreground">
            AI health score, confidence, and disease prediction fields exist on this visit record but
            aren't populated yet — no AI model is wired up.
          </div>

          <Button type="button" onClick={handleSubmit} disabled={recordVisit.isPending} className="w-full gap-2">
            {recordVisit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save visit
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
