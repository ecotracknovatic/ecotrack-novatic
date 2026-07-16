import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  LocationPicker,
  type LocationPickerValue,
  type LocationPickerChange,
} from "./LocationPicker";
import { usePlantingEvents, useRegisterBulkTrees, type BulkTreePayload } from "@/hooks/useTrees";
import { toast } from "sonner";
import { Leaf, Plus, Sparkles, Upload, Loader2, Info, Calendar } from "lucide-react";

// --- VALIDATION SCHEMAS ---

const singleTreeSchema = z.object({
  species: z.string().min(2, "Species name must be at least 2 characters."),
  status: z.enum(["healthy", "needs_attention", "dead"]),
  height: z.coerce.number().min(0.1, "Height must be a positive number"),
  location: z.object({
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    location_name: z.string(),
    town: z.string(),
    lga: z.string(),
    state: z.string(),
    country: z.string(),
  }),
});

const bulkTreeItemSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  species: z.string().min(1, "Species required"),
  tree_condition: z.enum(["healthy", "needs_attention", "dead"]),
  tree_health: z.enum(["excellent", "good", "fair", "poor", "critical"]),
  height: z.number().optional(),
  dbh: z.number().optional(),
  canopy_width_m: z.number().optional(),
});

const bulkRegistrationSchema = z.object({
  plantingEventId: z.string().uuid("Please select a valid planting campaign event."),
  trees: z.array(bulkTreeItemSchema).min(1, "At least one tree must be parsed to submit."),
});

interface SingleTreeFormValues {
  species: string;
  status: "healthy" | "needs_attention" | "dead";
  height: number;
  location: LocationPickerValue;
}

type BulkFormValues = z.infer<typeof bulkRegistrationSchema>;

const DEFAULT_LOCATION: LocationPickerValue = {
  latitude: null,
  longitude: null,
  location_name: "",
  town: "",
  lga: "",
  state: "",
  country: "",
};

export function TreeRegistrationDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [csvInput, setCsvInput] = useState("");

  // --- QUERY HOOKS ---
  const { data: plantingEvents, isLoading: isLoadingEvents } = usePlantingEvents();
  const bulkRegisterMutation = useRegisterBulkTrees();

  // Single Form Instance
  const singleForm = useForm<SingleTreeFormValues>({
    resolver: zodResolver(singleTreeSchema),
    defaultValues: {
      species: "",
      status: "healthy",
      height: 3.5,
      location: DEFAULT_LOCATION,
    },
  });

  // Bulk Form Instance
  const bulkForm = useForm<BulkFormValues>({
    resolver: zodResolver(bulkRegistrationSchema),
    defaultValues: {
      plantingEventId: "",
      trees: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: bulkForm.control,
    name: "trees",
  });

  // --- CSV PARSER FOR BULK REGISTRATION ---
  const handleParseCSV = () => {
    if (!csvInput.trim()) {
      toast.error("Please enter coordinate data first.");
      return;
    }

    try {
      const lines = csvInput.trim().split("\n");
      const parsedTrees: z.infer<typeof bulkTreeItemSchema>[] = [];

      lines.forEach((line) => {
        // Skip header lines
        if (line.toLowerCase().includes("latitude") || line.toLowerCase().includes("lat")) {
          return;
        }

        const cols = line.split(",").map((col) => col.trim());
        if (cols.length < 3) return;

        const lat = parseFloat(cols[0]);
        const lon = parseFloat(cols[1]);
        const species = cols[2];

        // Parse explicit conditions
        const rawCondition = cols[3]?.toLowerCase();
        const tree_condition = ["healthy", "needs_attention", "dead"].includes(rawCondition)
          ? (rawCondition as "healthy" | "needs_attention" | "dead")
          : "healthy";

        const rawHealth = cols[4]?.toLowerCase();
        const tree_health = ["excellent", "good", "fair", "poor", "critical"].includes(rawHealth)
          ? (rawHealth as "excellent" | "good" | "fair" | "poor" | "critical")
          : "good";

        const height = cols[5] ? parseFloat(cols[5]) : undefined;
        const dbh = cols[6] ? parseFloat(cols[6]) : undefined;
        const canopy_width_m = cols[7] ? parseFloat(cols[7]) : undefined;

        if (!isNaN(lat) && !isNaN(lon) && species) {
          parsedTrees.push({
            latitude: lat,
            longitude: lon,
            species,
            tree_condition,
            tree_health,
            height,
            dbh,
            canopy_width_m,
          });
        }
      });

      if (parsedTrees.length === 0) {
        toast.error("Could not parse any valid tree rows. Please check the format.");
        return;
      }

      replace(parsedTrees);
      toast.success(`Successfully parsed ${parsedTrees.length} trees!`);
    } catch (err) {
      toast.error("Failed to parse CSV format.");
    }
  };

  // --- SUBMIT HANDLERS ---

  const onSingleSubmit = async (data: SingleTreeFormValues) => {
    if (data.location.latitude === null || data.location.longitude === null) {
      singleForm.setError("location", {
        type: "manual",
        message: "Please select a location on the map",
      });
      return;
    }

    // Submit individual registration
    toast.info("Single registration submitting logic connected here.");
  };

  const onBulkSubmit = async (data: BulkFormValues) => {
    // Transform parsed preview elements to match the hook payload requirements
    const formattedTrees: BulkTreePayload[] = data.trees.map((t) => ({
      species: t.species,
      latitude: t.latitude,
      longitude: t.longitude,
      tree_condition: t.tree_condition,
      tree_health: t.tree_health,
      height: t.height,
      dbh: t.dbh,
      canopy_width_m: t.canopy_width_m,
      survival_status: t.tree_condition !== "dead",
    }));

    bulkRegisterMutation.mutate(
      {
        plantingEventId: data.plantingEventId,
        trees: formattedTrees,
      },
      {
        onSuccess: () => {
          bulkForm.reset();
          setCsvInput("");
          setOpen(false);
        },
      },
    );
  };

  const isSubmitting = bulkRegisterMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Register Trees
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-emerald-800">
            <Leaf className="h-5 w-5 text-emerald-600" /> Register Trees
          </DialogTitle>
          <DialogDescription>
            Add a newly planted tree or bulk-register coordinates from a spatial campaign.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "single" | "bulk")}
          className="flex-1 flex flex-col min-h-0 pt-4"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
            <TabsTrigger value="single" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Single Registration
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Bulk Upload
            </TabsTrigger>
          </TabsList>

          {/* SINGLE REGISTRATION TAB */}
          <TabsContent value="single" className="flex-1 overflow-y-auto pr-1">
            <Form {...singleForm}>
              <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={singleForm.control}
                      name="species"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tree Species</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Mahogany, Neem, Gmelina" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={singleForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="healthy">Healthy</SelectItem>
                                <SelectItem value="needs_attention">Needs Attention</SelectItem>
                                <SelectItem value="dead">Dead</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={singleForm.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (m)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col h-[280px]">
                    <FormLabel className="mb-2">Select Location</FormLabel>
                    <FormField
                      control={singleForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="flex-1 relative flex flex-col">
                          <FormControl className="flex-1 min-h-0">
                            <LocationPicker
                              value={field.value || DEFAULT_LOCATION}
                              onChange={(locationUpdate: LocationPickerChange) => {
                                field.onChange(locationUpdate);
                              }}
                            />
                          </FormControl>
                          <FormMessage className="mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                    disabled={isSubmitting}
                  >
                    Save Tree
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* BULK REGISTRATION TAB */}
          <TabsContent value="bulk" className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <Form {...bulkForm}>
              <form
                onSubmit={bulkForm.handleSubmit(onBulkSubmit)}
                className="space-y-4 flex-1 flex flex-col min-h-0"
              >
                {/* 1. Planting Event Selector */}
                <FormField
                  control={bulkForm.control}
                  name="plantingEventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 font-semibold">
                        <Calendar className="h-4 w-4 text-emerald-600" /> Associated Campaign /
                        Planting Event
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                isLoadingEvents
                                  ? "Loading campaign lists..."
                                  : "Select planting event to bind trees to..."
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plantingEvents?.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name} {event.location_name ? `(${event.location_name})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 2. CSV Inputs */}
                <div className="space-y-2">
                  <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                    Paste Tree Coordinates (CSV format)
                  </FormLabel>
                  <Textarea
                    placeholder="latitude, longitude, species, condition, health, height, dbh, canopy&#10;9.0820, 8.6753, Mahogany, healthy, excellent, 4.5, 0.12, 1.5&#10;9.0831, 8.6761, Neem, needs_attention, fair, 3.0, 0.08, 0.8"
                    className="font-mono text-xs min-h-[100px] bg-muted/30"
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <Info className="h-3 w-3 text-sky-600" />
                      Syntax:{" "}
                      <code>
                        lat, lon, species, [condition], [health], [height], [dbh], [canopy]
                      </code>
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                      onClick={handleParseCSV}
                    >
                      Parse Coordinates
                    </Button>
                  </div>
                </div>

                {/* 3. Parsed preview container */}
                <div className="flex-1 flex flex-col min-h-[150px] border rounded-lg bg-muted/10 overflow-hidden">
                  <div className="bg-muted px-3 py-2 text-xs font-semibold border-b text-muted-foreground flex justify-between">
                    <span>Parsed Trees Preview</span>
                    <span>{fields.length} rows loaded</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {fields.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                        No parsed data to preview. Paste CSV content above and click "Parse
                        Coordinates".
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="pb-1 font-medium">Coords (Lat, Lon)</th>
                              <th className="pb-1 font-medium">Species</th>
                              <th className="pb-1 font-medium">Condition</th>
                              <th className="pb-1 font-medium text-right">Metrics (H/DBH)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fields.map((field) => (
                              <tr key={field.id} className="border-b/50 py-1">
                                <td className="py-1 font-mono text-[11px]">
                                  {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                                </td>
                                <td className="py-1 font-medium">{field.species}</td>
                                <td className="py-1 text-[11px]">
                                  <span className="capitalize font-semibold text-emerald-700">
                                    {field.tree_condition}
                                  </span>
                                  <span className="text-muted-foreground ml-1">
                                    ({field.tree_health})
                                  </span>
                                </td>
                                <td className="py-1 text-right text-muted-foreground font-mono">
                                  {field.height ? `${field.height}m` : "—"} /{" "}
                                  {field.dbh ? `${field.dbh}m` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[155px]"
                    disabled={isSubmitting || fields.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving in database...
                      </>
                    ) : (
                      `Register ${fields.length} Trees`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
