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

/**
 * Default logged day when prepending before the current head: the former first film’s
 * logged date, else its release date (YYYY-MM-DD prefix), else today.
 */
export function defaultPastLinkLoggedDateFromHeadLink(
  first: { loggedDate?: string | null; movie: { release_date: string } } | undefined
): string {
  if (!first) return localDateString();
  const log = first.loggedDate?.trim();
  if (log) return log;
  const rd = first.movie.release_date?.trim();
  if (rd) {
    const m = rd.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  return localDateString();
}
