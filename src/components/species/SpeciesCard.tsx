import { Link } from "@tanstack/react-router";
import { Leaf, Droplets, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Species } from "@/types/species";

function Badge({ children, tone = "bg-accent text-foreground" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize ${tone}`}>
      {children}
    </span>
  );
}

export function SpeciesCard({ species }: { species: Species }) {
  return (
    <Link to="/species/$speciesId" params={{ speciesId: species.id }}>
      <Card className="h-full overflow-hidden rounded-2xl transition hover:shadow-[var(--shadow-elegant)]">
        <div className="flex h-32 items-center justify-center bg-muted/50">
          {species.image_url ? (
            <img src={species.image_url} alt={species.common_name} className="h-full w-full object-cover" />
          ) : (
            <Leaf className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        <CardContent className="space-y-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{species.common_name}</p>
              {species.scientific_name && (
                <p className="truncate text-xs italic text-muted-foreground">{species.scientific_name}</p>
              )}
            </div>
            {!species.is_active && (
              <Badge tone="bg-muted text-muted-foreground shrink-0">Inactive</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {species.species_code && <Badge tone="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{species.species_code}</Badge>}
            {species.native_status && <Badge>{species.native_status}</Badge>}
          </div>

          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            {species.growth_rate && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {species.growth_rate}
              </span>
            )}
            {species.water_requirement && (
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {species.water_requirement}
              </span>
            )}
            {species.carbon_factor !== null && (
              <span>{species.carbon_factor} kg C</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
