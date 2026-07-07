export const MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS = 5_000;

export type LocationAccuracyQuality = {
  label: "Precise" | "Good" | "Approximate" | "Very approximate" | "Unknown";
  tone: "success" | "warning" | "danger" | "neutral";
  guidance: string;
};

export function getSalesRepLocationQuality(value: unknown): LocationAccuracyQuality {
  const accuracy = Number(value);
  if (!Number.isFinite(accuracy) || accuracy < 0) {
    return { label: "Unknown", tone: "neutral", guidance: "Waiting for the device to report accuracy." };
  }
  if (accuracy <= 50) {
    return { label: "Precise", tone: "success", guidance: "This is a strong GPS fix." };
  }
  if (accuracy <= 250) {
    return { label: "Good", tone: "success", guidance: "The pin is suitable for route visibility." };
  }
  if (accuracy <= 1_000) {
    return { label: "Approximate", tone: "warning", guidance: "The location is usable; open sky can tighten the pin." };
  }
  return { label: "Very approximate", tone: "danger", guidance: "The location is saved, but the rep should move outdoors when practical." };
}
