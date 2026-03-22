/**
 * Calendar date in the user's local timezone (YYYY-MM-DD). Used for stats heatmap buckets.
 */
export function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Safe YYYY-MM-DD for heatmap / daily stats. Empty or missing values fall back to today.
 */
export function normalizeLoggedDateForHeatmap(dateStr?: string | null): string {
  const t = dateStr?.trim();
  if (!t) return localDateString();
  return t;
}
