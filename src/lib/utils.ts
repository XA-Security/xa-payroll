import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date-only string (YYYY-MM-DD) in local timezone, not UTC
 * This prevents timezone shifts that make dates appear off by a day
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at midnight local time
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Format a date-only string to a localized readable format
 * Handles GMT-7 and other timezones correctly
 * @param dateString - Date string in YYYY-MM-DD format or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatLocalDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  // If it's just a date string (YYYY-MM-DD), parse it locally
  if (dateString.length === 10 && dateString.includes('-')) {
    return parseLocalDate(dateString).toLocaleDateString('en-US', options)
  }
  // Otherwise parse as ISO string (with timezone info)
  return new Date(dateString).toLocaleDateString('en-US', options)
}
