import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface BulkRegisterProps {
  projectid: string;
  projectLatitude?: number | null;
  projectLongitude?: number | null;
  onSuccess?: () => void;
}

interface TreeInputRow {
  species: string;
  latitude: number;
  longitude: number;
  status: string;
}

export function BulkTreeRegister({
  projectId,
  projectLatitude,
  projectLongitude,
  onSuccess,
}: BulkRegisterProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rawCsv, setRawCsv] = useState("");
  const [defaultSpecies, setDefaultSpecies] = useState("Mahogany");

  const bulkInsertMutation = useMutation({
    mutationFn: async (parsedTrees: TreeInputRow[]) => {
      if (!user) throw new Error("Authentication required.");
      if (!parsedTrees.length) throw new Error("No valid trees found to register.");

      // Call our Supabase Postgres RPC function
      const { error } = await supabase.rpc("register_bulk_trees", {
        p_project_id: projectId,
        p_created_by: user.id,
        p_trees: parsedTrees, // Passes array seamlessly as JSONB
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bulk tree registration completed successfully!");
      setRawCsv("");
      qc.invalidateQueries({ queryKey: ["trees", projectId] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(`Registration failed: ${err.message || "Unknown database error"}`);
    },
  });

  // Simple CSV parser supporting standard copy-paste layouts from Excel/Sheets
  // Format expected: Species, Latitude, Longitude
  const handleProcessAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rawCsv.trim()) {
      toast.error("Please provide tree data first.");
      return;
    }

    const lines = rawCsv.split("\n");
    const parsedTrees: TreeInputRow[] = [];

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return; // Skip empty rows

      // Split by comma or tab (Excel copy-paste fallback)
      const columns = cleanLine.split(/,|\t/).map((c) => c.trim());

      let species = defaultSpecies;
      let lat = projectLatitude || 0;
      let lng = projectLongitude || 0;

      if (columns.length >= 3) {
        // Full Row: Species, Lat, Lng
        species = columns[0] || defaultSpecies;
        lat = parseFloat(columns[1]);
        lng = parseFloat(columns[2]);
      } else if (columns.length === 2) {
        // Coordinate Only Row: Lat, Lng (uses fallback default species)
        lat = parseFloat(columns[0]);
        lng = parseFloat(columns[1]);
      }

      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Skipping invalid line ${index + 1}: Coordinate mapping failed.`);
        return;
      }

      parsedTrees.push({
        species,
        latitude: lat,
        longitude: lng,
        status: "planted",
      });
    });

    if (parsedTrees.length === 0) {
      toast.error("Could not parse any valid coordinate sets from the input.");
      return;
    }

    bulkInsertMutation.mutate(parsedTrees);
  };

  // Helper utility to quickly mock/generate test coordinates around the project site location
  const generateMockData = () => {
    const centerLat = projectLatitude || 9.082;
    const centerLng = projectLongitude || 8.6753;
    const items: string[] = [];

    for (let i = 0; i < 50; i++) {
      // Create scattered points within roughly a 500m radius
      const randomLat = centerLat + (Math.random() - 0.5) * 0.005;
      const randomLng = centerLng + (Math.random() - 0.5) * 0.005;
      items.push(`${defaultSpecies}, ${randomLat.toFixed(6)}, ${randomLng.toFixed(6)}`);
    }

    setRawCsv(items.join("\n"));
    toast.info("Generated 50 sample tree strings for staging.");
  };

  return (
    <form onSubmit={handleProcessAndSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="defaultSpecies">Fallback Common Species</Label>
        <Input
          id="defaultSpecies"
          value={defaultSpecies}
          onChange={(e) => setDefaultSpecies(e.target.value)}
          placeholder="e.g., Mahogany, Neem, Iroko"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="csvData">Tree Registry Matrix (CSV or Tab Delimited)</Label>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={generateMockData}
            className="text-xs h-7 px-2"
          >
            Generate 50 Sample Rows
          </Button>
        </div>
        <Textarea
          id="csvData"
          placeholder="Format: Species, Latitude, Longitude&#10;Mahogany, 9.08212, 8.67543&#10;Neem, 9.08311, 8.67498"
          rows={8}
          className="font-mono text-xs"
          value={rawCsv}
          onChange={(e) => setRawCsv(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Tip: You can copy and paste lists directly from your spreadsheets. If missing a species
          column, the fallback value above will apply.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={bulkInsertMutation.isPending}>
        {bulkInsertMutation.isPending
          ? `Registering ${rawCsv.split("\n").filter(Boolean).length} Identity Nodes...`
          : "Execute Bulk Registration"}
      </Button>
    </form>
  );
}
