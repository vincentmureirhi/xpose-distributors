import { apiClient } from "./client";

export interface RegionOption {
  id: string;
  name: string;
  description?: string | null;
  location_count?: number | string | null;
}

export interface LocationOption {
  id: string;
  name: string;
  region_id: string;
  region_name?: string | null;
  customer_count?: number | string | null;
}

function extractRows<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(root.regions)) return root.regions as T[];
  if (Array.isArray(root.locations)) return root.locations as T[];
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    if (Array.isArray(dataObj.regions)) return dataObj.regions as T[];
    if (Array.isArray(dataObj.locations)) return dataObj.locations as T[];
  }

  return [];
}

export async function listRegions(search?: string): Promise<RegionOption[]> {
  const { data } = await apiClient.get("/regions", {
    params: search ? { search } : undefined,
  });

  return extractRows<Record<string, unknown>>(data)
    .map((row) => {
      const id = row.id;
      const name = row.name;
      if (id == null || !name) return null;
      return {
        id: String(id),
        name: String(name),
        description: row.description == null ? null : String(row.description),
        location_count: row.location_count as RegionOption["location_count"],
      };
    })
    .filter((region): region is RegionOption => !!region);
}

export async function listLocations(options: {
  region_id?: string;
  search?: string;
} = {}): Promise<LocationOption[]> {
  const { data } = await apiClient.get("/locations", {
    params: {
      ...(options.region_id ? { region_id: options.region_id } : {}),
      ...(options.search ? { search: options.search } : {}),
    },
  });

  return extractRows<Record<string, unknown>>(data)
    .map((row) => {
      const id = row.id;
      const name = row.name;
      const regionId = row.region_id;
      if (id == null || !name || regionId == null) return null;
      return {
        id: String(id),
        name: String(name),
        region_id: String(regionId),
        region_name: row.region_name == null ? null : String(row.region_name),
        customer_count: row.customer_count as LocationOption["customer_count"],
      };
    })
    .filter((location): location is LocationOption => !!location);
}
