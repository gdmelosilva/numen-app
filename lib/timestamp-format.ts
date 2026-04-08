/**
 * Utility functions for consistent timestamp formatting
 * Ensures all dates sent to the API have the ISO 8601 format with T separator
 */

/**
 * Converts a date string to ISO 8601 format with time component
 * If the date is just a date string (YYYY-MM-DD), adds T00:00:00
 * If it already has a T, returns as-is
 * @param dateString - The date string to format (e.g., "2026-04-07" or "2026-04-07T15:00:00")
 * @returns Formatted timestamp string in ISO 8601 format (e.g., "2026-04-07T00:00:00")
 */
export function ensureTimestampFormat(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  
  // If it already has a T, it's already in correct format
  if (dateString.includes('T')) {
    return dateString;
  }
  
  // Otherwise, append T00:00:00 to convert date-only to timestamp
  return `${dateString}T00:00:00`;
}

/**
 * Combines a date string with a time string to create a full ISO 8601 timestamp
 * @param dateString - The date part (e.g., "2026-04-07")
 * @param timeString - The time part (e.g., "15:30")
 * @returns Full ISO 8601 timestamp (e.g., "2026-04-07T15:30:00")
 */
export function combineDateAndTime(
  dateString: string | null | undefined,
  timeString: string | null | undefined
): string | null {
  if (!dateString || !timeString) return null;
  
  // Ensure time has seconds if it doesn't
  const timeWithSeconds = timeString.includes(':') 
    ? (timeString.split(':').length === 2 ? `${timeString}:00` : timeString)
    : `${timeString}:00`;
  
  return `${dateString}T${timeWithSeconds}`;
}

/**
 * Validates that a timestamp is in proper ISO 8601 format
 * @param timestamp - The timestamp to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimestamp(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false;
  
  // Check if it has the T separator and can be parsed
  if (!timestamp.includes('T')) return false;
  
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
