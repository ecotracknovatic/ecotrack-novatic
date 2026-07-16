import { Link } from "@tanstack/react-router";
import type { Species } from "@/types/species";

export function SpeciesTable({ items }: { items: Species[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Common name</th>
            <th className="px-3 py-2 font-medium">Scientific name</th>
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Native status</th>
            <th className="px-3 py-2 font-medium">Growth rate</th>
            <th className="px-3 py-2 font-medium">Carbon factor</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((species) => (
            <tr key={species.id} className="hover:bg-accent/40">
              <td className="px-3 py-2">
                <Link
                  to="/species/$speciesId"
                  params={{ speciesId: species.id }}
                  className="font-medium text-foreground hover:underline"
                >
                  {species.common_name}
                </Link>
              </td>
              <td className="px-3 py-2 italic text-muted-foreground">{species.scientific_name || "—"}</td>
              <td className="px-3 py-2 font-mono text-xs">{species.species_code || "—"}</td>
              <td className="px-3 py-2 capitalize">{species.native_status || "—"}</td>
              <td className="px-3 py-2 capitalize">{species.growth_rate || "—"}</td>
              <td className="px-3 py-2">{species.carbon_factor ?? "—"}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    species.is_active
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-950/40 dark:text-green-300"
                      : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  }
                >
                  {species.is_active ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
