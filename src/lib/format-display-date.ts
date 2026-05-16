const DISPLAY_DATE_LOCALE = "en-US";

const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

/** Stable date formatting for SSR + client (avoids locale hydration mismatches). */
export function formatDisplayDate(
  value: string | number | Date,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(DISPLAY_DATE_LOCALE, DISPLAY_DATE_OPTIONS);
}
