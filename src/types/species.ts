export interface Species {
  id: number; // BigInt in PostgreSQL maps to number in TypeScript
  organization_id: string | null; // UUID
  common_name: string;
  scientific_name: string | null;
  family: string | null;
  species_code: string | null;
  native_status: string | null;
  growth_rate: string | null;
  carbon_factor: number | null;
  water_requirement: string | null;
  soil_type: string | null;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Extended species attributes
  leaf_type: string | null;
  canopy_diameter: number | null;
  average_height: number | null;
  lifespan: number | null;
  flowering_season: string | null;
  fruiting_season: string | null;
  root_system: string | null;
}

export interface SpeciesInput {
  organization_id?: string | null;
  common_name: string;
  scientific_name?: string | null;
  family?: string | null;
  species_code?: string | null;
  native_status?: string | null;
  growth_rate?: string | null;
  carbon_factor?: number | null;
  water_requirement?: string | null;
  soil_type?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_path?: string | null;
  is_active?: boolean;
  // Extended species attributes
  leaf_type?: string | null;
  canopy_diameter?: number | null;
  average_height?: number | null;
  lifespan?: number | null;
  flowering_season?: string | null;
  fruiting_season?: string | null;
  root_system?: string | null;
}

// Fixed casing to match DB check constraints:
// native_status IN ('Native', 'Exotic', 'Naturalized', 'Invasive')
export const NATIVE_STATUS_SUGGESTIONS = [
  "Native",
  "Exotic",
  "Naturalized",
  "Invasive",
];

// growth_rate IN ('Slow', 'Medium', 'Fast')
export const GROWTH_RATE_SUGGESTIONS = [
  "Slow",
  "Medium",
  "Fast",
];

// water_requirement IN ('Low', 'Medium', 'High')
export const WATER_REQUIREMENT_SUGGESTIONS = [
  "Low",
  "Medium",
  "High",
];

// soil_type IN ('Clay', 'Sandy', 'Loamy', 'Silty', 'Peaty', 'Chalky', 'Well-Drained', 'Any')
export const SOIL_TYPE_SUGGESTIONS = [
  "Clay",
  "Sandy",
  "Loamy",
  "Silty",
  "Peaty",
  "Chalky",
  "Well-Drained",
  "Any",
];

// leaf_type IN ('Evergreen', 'Deciduous', 'Semi-Evergreen')
export const LEAF_TYPE_SUGGESTIONS = [
  "Evergreen",
  "Deciduous",
  "Semi-Evergreen",
];