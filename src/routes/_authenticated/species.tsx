import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, List, Leaf, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpeciesStats } from "@/components/species/SpeciesStats";
import { SpeciesSearch } from "@/components/species/SpeciesSearch";
import { SpeciesFilters, type SpeciesFiltersValue } from "@/components/species/SpeciesFilters";
import { SpeciesCard } from "@/components/species/SpeciesCard";
import { SpeciesTable } from "@/components/species/SpeciesTable";
import { SpeciesGridSkeleton, SpeciesTableSkeleton } from "@/components/species/SpeciesSkeletons";
import { useSpecies } from "@/hooks/species/useSpecies";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const Route = createFileRoute("/_authenticated/species")({
  head: () => ({ meta: [{ title: "Species — EcoTrack Novatic" }] }),
  component: SpeciesList,
});

function SpeciesList() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SpeciesFiltersValue>({
    nativeStatus: null,
    growthRate: null,
    isActive: null,
  });
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);

  const species = useSpecies({
    search: debouncedSearch,
    nativeStatus: filters.nativeStatus,
    growthRate: filters.growthRate,
    isActive: filters.isActive,
    page,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Species"
        description="Manage the species catalog used across projects and bulk tree registration."
        actions={
          <Button asChild className="gap-2">
            <Link to="/species/new">
              <Plus className="h-4 w-4" />
              New species
            </Link>
          </Button>
        }
      />

      <SpeciesStats />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SpeciesSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <SpeciesFilters
            value={filters}
            onChange={(v) => {
              setFilters(v);
              setPage(1);
            }}
          />
        </div>

        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            type="button"
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {species.isLoading ? (
        view === "grid" ? <SpeciesGridSkeleton /> : <SpeciesTableSkeleton />
      ) : species.error ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-sm text-destructive">
            Couldn't load species right now.
          </CardContent>
        </Card>
      ) : !species.data?.items.length ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Leaf className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              {debouncedSearch || filters.nativeStatus || filters.growthRate || filters.isActive !== null
                ? "No species match your search and filters."
                : "No species yet — add one to start building your catalog."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {species.data.items.map((s) => (
                <SpeciesCard key={s.id} species={s} />
              ))}
            </div>
          ) : (
            <SpeciesTable items={species.data.items} />
          )}

          {species.data.pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {species.data.page} of {species.data.pageCount} — {species.data.totalCount} species
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= species.data.pageCount}
                  onClick={() => setPage((p) => Math.min(species.data!.pageCount, p + 1))}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
