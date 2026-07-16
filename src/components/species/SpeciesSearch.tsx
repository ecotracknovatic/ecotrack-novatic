import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SpeciesSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SpeciesSearch({ value, onChange }: SpeciesSearchProps) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by common or scientific name…"
        className="pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
