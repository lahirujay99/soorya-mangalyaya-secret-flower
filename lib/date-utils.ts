/**
 * Date utility functions for handling timezone conversion and formatting
 * for the Solar Festival event application
 */

// Sri Lanka timezone is UTC+5:30 (Asia/Colombo)
const SRI_LANKA_OFFSET_HOURS = 5.5;
const SRI_LANKA_OFFSET_MS = SRI_LANKA_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Get the current date and time in Sri Lanka timezone
 * @returns Date object adjusted to Sri Lanka timezone
 */
export const getCurrentDateInSriLankaTimezone = (): Date => {
  // Create date in UTC
  const now = new Date();
  
  // Convert to Asia/Colombo timezone (UTC+5:30)
  const sriLankaTime = new Date(now.getTime() + SRI_LANKA_OFFSET_MS);
  
  return sriLankaTime;
};

/**
 * Convert any date to Sri Lanka timezone
 * @param date The date to convert
 * @returns Date object adjusted to Sri Lanka timezone
 */
export const convertToSriLankaTimezone = (date: Date): Date => {
  // Get the UTC time in milliseconds
  const utcTime = date.getTime();
  
  // Add Sri Lanka offset to get the time in Asia/Colombo timezone
  const sriLankaTime = new Date(utcTime + SRI_LANKA_OFFSET_MS);
  
  return sriLankaTime;
};

/**
 * Format a date for display in Sri Lanka format (DD/MM/YYYY HH:MM:SS)
 * @param date The date to format
 * @param convertTimezone Whether to convert the date to Sri Lanka timezone first
 * @returns Formatted date string
 */
export const formatDateForDisplay = (date: Date, convertTimezone = true): string => {
  const targetDate = convertTimezone ? convertToSriLankaTimezone(date) : date;
  
  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const year = targetDate.getFullYear();
  
  const hours = String(targetDate.getHours()).padStart(2, '0');
  const minutes = String(targetDate.getMinutes()).padStart(2, '0');
  const seconds = String(targetDate.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Sort responses by submission time to find the earliest correct guess
 * @param responses Array of responses with submitted_at field
 * @returns Sorted array with earliest submissions first
 */
export const sortResponsesBySubmissionTime = <T extends { submitted_at: Date }>(responses: T[]): T[] => {
  return [...responses].sort((a, b) => a.submitted_at.getTime() - b.submitted_at.getTime());
};