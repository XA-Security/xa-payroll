import { getSupabaseAdmin } from "./supabase/admin";
import type {
  HumanityConfirmedTimesheetsResponse,
  HumanityEmployeeResponse,
  HumanityEmployeesListResponse,
  HumanityEmployeePositionsResponse,
  HumanityPositionsResponse,
  UpdateEmployeeRequest,
  UpdateEmployeePositionRequest,
} from "@/types/humanity";
import type { HumanityTimeclocksResponse, HumanityPayrollReportResponse } from "@/types/timeclock";

// Debug logging control for Humanity API calls
const HUMANITY_DEBUG = process.env.HUMANITY_DEBUG === 'true';

function humanityLog(message: string, data?: unknown) {
  if (HUMANITY_DEBUG) {
    console.log(message, data);
  }
}

/**
 * In-memory cache for Humanity API responses
 * Reduces rate limiting issues and improves dashboard performance
 */
type CacheEntry = { data: unknown; expiresAt: number };
const apiCache = new Map<string, CacheEntry>();

/**
 * Get cached data if it exists and hasn't expired
 */
function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    apiCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store data in cache with TTL
 */
function setCached<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
  apiCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
  humanityLog('[Cache] Stored:', { key, expiresIn: `${ttlMs / 1000}s` });
}

/**
 * Generate cache key from URL and params
 */
function getCacheKey(url: string): string {
  return url;
}

/**
 * Fetch with retry logic for 429 errors
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s)
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If not 429, return response (even if error)
      if (response.status !== 429) {
        return response;
      }

      // If 429 and we have retries left, wait and retry
      if (attempt < retries) {
        const backoffMs = 2 ** attempt * 1000; // 1s, 2s, 4s
        console.warn(
          `[Humanity API] Got 429, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${retries})`
        );
        await delay(backoffMs);
        continue;
      }

      // Out of retries, return the 429 response
      return response;
    } catch (error) {
      // Network error or abort
      if (attempt < retries) {
        const backoffMs = 2 ** attempt * 1000;
        console.warn(
          `[Humanity API] Network error, retrying in ${backoffMs}ms:`,
          error instanceof Error ? error.message : error
        );
        await delay(backoffMs);
        continue;
      }
      throw error;
    }
  }

  // Unreachable, but satisfies TypeScript
  throw new Error('Max retries exceeded');
}

/**
 * Fetch Humanity access token from the keys table
 */
export async function getHumanityAccessToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("Keys")
      .select("token")
      .eq("id", 1)
      .single() as { data: { token: string } | null; error: any };

    if (error) throw error;
    return data?.token || null;
  } catch (error) {
    console.error("Error fetching Humanity access token:", error);
    return null;
  }
}

/**
 * Fetch confirmed timesheets from Humanity API using Custom Report
 * This replaces the legacy /api/v2/shifts endpoint with location filtering support
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 * @param employeeId - Optional: Filter by specific employee internal ID. If not provided, fetches all employees.
 * @param locationId - Optional: Filter by location/site ID. If not provided, fetches all locations.
 */
export async function fetchConfirmedTimesheets(
  accessToken: string,
  startDate: string,
  endDate: string,
  employeeId?: string,
  locationId?: string
): Promise<HumanityConfirmedTimesheetsResponse> {
  const employeeParam = employeeId ? employeeId : 'all';
  let url = `https://www.humanity.com/api/v2/reports/custom?access_token=${accessToken}&start_date=${startDate}&end_date=${endDate}&type=confirmedtimesheets&employee=${employeeParam}&fields=employee,eid,remote_site,schedule_name,start_day,end_day,start_time,end_time,total_time,overtime,notes,title,break_in_out_time,shift_id,schedule_id,status`;

  // Add location filter if provided
  if (locationId) {
    url += `&location=${encodeURIComponent(locationId)}`;
  }

  // Check cache first
  const cacheKey = getCacheKey(url);
  const cached = getCached<HumanityConfirmedTimesheetsResponse>(cacheKey);
  if (cached) {
    humanityLog('[Humanity API] Returning cached timesheets:', { startDate, endDate });
    return cached;
  }

  humanityLog('[Humanity API] Fetching timesheets:', { startDate, endDate });

  // Add timeout to prevent hanging - 30 seconds max
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetchWithRetry(url, { signal: controller.signal });

    if (!response.ok) {
      console.error('[Humanity API] Request failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    humanityLog('[Humanity API] Raw response status:', rawData.status);

    // Extract shift data - the API returns shifts with numeric keys
    // Filter out metadata fields which have string keys like 'token', 'method', etc.
    const shiftsData = rawData.data || {};
    const numericKeyedData = Object.fromEntries(
      Object.entries(shiftsData).filter(([key]) => /^\d+$/.test(key))
    );

    humanityLog('[Humanity API] Extracted numeric keys:', {
      totalKeys: Object.keys(shiftsData).length,
      numericKeys: Object.keys(numericKeyedData).length,
      sampleNumericKeys: Object.keys(numericKeyedData).slice(0, 5),
    });
    humanityLog('[Humanity API] First item sample:', Object.values(numericKeyedData)[0]);

    // Convert object with numeric keys to array, filtering out metadata fields
    // Only include objects that look like shift data (have shift-related fields)
    const shiftsArray = Object.values(numericKeyedData)
      .filter((item: any) => {
        // Filter out metadata fields and non-shift objects
        return item && typeof item === 'object' && (
          item.employee || item.start_day || item.start_time ||
          item.schedule_name || item.title || item.remote_site
        );
      })
      .map((shift: any) => ({
        ...shift,
        shift_title: shift.title || shift.shift_title,
      }));

    humanityLog('[Humanity API] Converted to array, count:', shiftsArray.length);

    const result = {
      data: shiftsArray,
      status: rawData.status,
    };

    // Cache the result
    setCached(cacheKey, result);

    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    throw error;
  }
}

/**

/**
 * Fetch confirmed shifts with timeclock data using Custom Report API
 * Bulk fetch for all shifts in date range - used for new Confirmed Shifts invoice flow
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 * @param locationId - Optional: Filter by location/site ID
 * @returns Array of timeclock entries with shift and position grouping metadata
 */
export async function fetchConfirmedShiftsWithTimeclocks(
  accessToken: string,
  startDate: string,
  endDate: string,
  locationId?: string
): Promise<HumanityConfirmedTimesheetsResponse> {
  // Use same Custom Report endpoint as fetchConfirmedTimesheets but with timeclock-specific fields
  // Include all fields needed for timeclock display and position grouping
  let url = `https://www.humanity.com/api/v2/reports/custom?access_token=${accessToken}&start_date=${startDate}&end_date=${endDate}&type=confirmedshifts&employee=all&fields=employee,eid,remote_site,schedule_name,start_day,end_day,start_time,end_time,total_time,overtime,notes,title,break_in_out_time,shift_id,schedule_id,status`;

  if (locationId) {
    url += `&location=${encodeURIComponent(locationId)}`;
  }

  humanityLog('[Humanity API] Fetching confirmed shifts with timeclocks:', { startDate, endDate, locationId });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      console.error('[Humanity API] Request failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    humanityLog('[Humanity API] Raw timeclocks response status:', rawData.status);

    // Extract shift data - filter out metadata fields which have string keys
    const shiftsData = rawData.data || {};
    const numericKeyedData = Object.fromEntries(
      Object.entries(shiftsData).filter(([key]) => /^\d+$/.test(key))
    );

    humanityLog('[Humanity API] Extracted numeric keys:', {
      totalKeys: Object.keys(shiftsData).length,
      numericKeys: Object.keys(numericKeyedData).length,
    });

    const shiftsArray = Object.values(numericKeyedData)
      .filter((item: any) => {
        return item && typeof item === 'object' && (
          item.employee || item.start_day || item.start_time ||
          item.schedule_name || item.title || item.remote_site
        );
      })
      .map((entry: any) => {
        // Transform Custom Report fields to HumanityTimeclockEntry structure
        const totalHours = Number.parseFloat(entry.total_time || 0);
        const breakTime = Number.parseFloat(entry.break_in_out_time || 0);

        // Use composite ID as consistent fallback (never use schedule_id as shift_id)
        const compositeId = `${entry.eid}-${entry.schedule_id}-${entry.start_day}-${entry.start_time}`;
        const actualShiftId = entry.shift_id || null;

        if (!actualShiftId) {
          humanityLog('[Humanity] Missing shift_id from API response, using composite ID', {
            eid: entry.eid,
            schedule_id: entry.schedule_id,
            start_day: entry.start_day,
            compositeId,
          });
        }

        return {
          // Required fields for HumanityTimeclockEntry
          id: actualShiftId || compositeId,
          shift: actualShiftId || compositeId,
          shift_id: actualShiftId || compositeId,
          schedule: {
            id: entry.schedule_id || '',
            name: entry.schedule_name || 'Unknown',
          },
          schedule_id: entry.schedule_id,
          employee: {
            id: entry.eid || '',
            name: entry.employee || 'Unknown Employee',
          },
          eid: entry.eid,
          start_timestamp: entry.start_day && entry.start_time
            ? `${entry.start_day} ${entry.start_time}`
            : '',
          end_timestamp: entry.end_day && entry.end_time
            ? `${entry.end_day} ${entry.end_time}`
            : '',
          status: entry.status || '1',
          break_time: breakTime,
          length: {
            hours: Math.floor(totalHours),
            mins: Math.round((totalHours % 1) * 60),
            total_hours: totalHours.toFixed(2),
          },
          // Additional Custom Report fields
          start_day: entry.start_day,
          end_day: entry.end_day,
          start_time: entry.start_time,
          end_time: entry.end_time,
          remote_site: entry.remote_site,
          schedule_name: entry.schedule_name,
          title: entry.title,
          overtime: entry.overtime || '0',
          notes: entry.notes,
        };
      });

    humanityLog('[Humanity API] Converted to array, count:', shiftsArray.length);
    humanityLog('[Humanity API] Sample transformed entry:', shiftsArray[0]);

    clearTimeout(timeoutId);
    return {
      data: shiftsArray,
      status: rawData.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    throw error;
  }
}

/**
 * Fetch confirmed timesheets (actuals) with timeclock data using Custom Report API
 * Uses confirmedtimesheets report type for actual employee clock-in/out records
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 * @param locationId - Optional: Filter by location/site ID
 * @returns Array of timeclock entries with actual hours worked
 */
export async function fetchConfirmedTimesheetsActualsV2(
  accessToken: string,
  startDate: string,
  endDate: string,
  locationId?: string
): Promise<HumanityConfirmedTimesheetsResponse> {
  // Use confirmedtimesheets report type instead of confirmedshifts
  // confirmedtimesheets has: employee, eid, schedule_name, start_day, end_day, start_time, end_time, remote_site
  // Missing: shift_id, overtime, status (we'll handle these)
  let url = `https://www.humanity.com/api/v2/reports/custom?access_token=${accessToken}&start_date=${startDate}&end_date=${endDate}&type=confirmedtimesheets&employee=all&fields=employee,eid,schedule_name,start_day,end_day,start_time,end_time,remote_site`;

  if (locationId) {
    url += `&location=${encodeURIComponent(locationId)}`;
  }

  humanityLog('[Humanity API] Fetching confirmed timesheets (Actuals V2):', { startDate, endDate, locationId });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      console.error('[Humanity API] Request failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    humanityLog('[Humanity API] Raw timesheets response status:', rawData.status);

    // Extract shift data - filter out metadata fields which have string keys
    const shiftsData = rawData.data || {};
    const numericKeyedData = Object.fromEntries(
      Object.entries(shiftsData).filter(([key]) => /^\d+$/.test(key))
    );

    humanityLog('[Humanity API] Extracted numeric keys:', {
      totalKeys: Object.keys(shiftsData).length,
      numericKeys: Object.keys(numericKeyedData).length,
    });

    // Helper to calculate hours from start/end times
    const calcHoursFromTimes = (startDay: string, endDay: string, startTime: string, endTime: string): number => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let total = (eh * 60 + em) - (sh * 60 + sm);
      if (startDay !== endDay) total += 24 * 60;
      return Math.max(0, total / 60);
    };

    const shiftsArray = Object.values(numericKeyedData)
      .filter((item: any) => {
        return item && typeof item === 'object' && (
          item.employee || item.start_day || item.start_time ||
          item.schedule_name
        );
      })
      .map((entry: any) => {
        // Calculate total hours from start/end times
        const totalHours = calcHoursFromTimes(
          entry.start_day || '',
          entry.end_day || '',
          entry.start_time || '',
          entry.end_time || ''
        );

        // Use composite ID as shift_id since confirmedtimesheets doesn't provide shift_id
        const compositeId = `${entry.eid}-${entry.schedule_name}-${entry.start_day}-${entry.start_time}`;

        return {
          // Required fields for HumanityTimeclockEntry
          id: compositeId,
          shift: compositeId,
          shift_id: compositeId,
          schedule: {
            id: entry.schedule_name || '',
            name: entry.schedule_name || 'Unknown',
          },
          schedule_id: entry.schedule_name,
          employee: {
            id: entry.eid || '',
            name: entry.employee || 'Unknown Employee',
          },
          eid: entry.eid,
          start_timestamp: entry.start_day && entry.start_time
            ? `${entry.start_day} ${entry.start_time}`
            : '',
          end_timestamp: entry.end_day && entry.end_time
            ? `${entry.end_day} ${entry.end_time}`
            : '',
          status: '1', // confirmedtimesheets doesn't provide status
          break_time: 0, // confirmedtimesheets doesn't provide break time
          length: {
            hours: Math.floor(totalHours),
            mins: Math.round((totalHours % 1) * 60),
            total_hours: totalHours.toFixed(2),
          },
          // Additional Custom Report fields
          start_day: entry.start_day,
          end_day: entry.end_day,
          start_time: entry.start_time,
          end_time: entry.end_time,
          remote_site: entry.remote_site || '',
          schedule_name: entry.schedule_name,
          title: entry.schedule_name,
          overtime: '0', // confirmedtimesheets doesn't provide overtime, use calculated hours
          notes: '',
        };
      });

    humanityLog('[Humanity API] Converted to array, count:', shiftsArray.length);
    humanityLog('[Humanity API] Sample transformed entry:', shiftsArray[0]);

    clearTimeout(timeoutId);
    return {
      data: shiftsArray,
      status: rawData.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    throw error;
  }
}

/**
 * Fetch payroll report from Humanity's v2 API
 * Returns pre-calculated hours (regular, OT, STAT) and payroll costs per employee
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 * @param remoteSiteId - Optional remote site ID to filter by
 * @param deductBreaks - When true, deduct unpaid breaks from hours (deduct_breaks=1). Default true.
 */
export async function fetchPayrollReport(
  accessToken: string,
  startDate: string,
  endDate: string,
  remoteSiteId?: string,
  deductBreaks: boolean = true
): Promise<HumanityPayrollReportResponse> {
  let url = `https://www.humanity.com/api/v2/payroll/report?access_token=${accessToken}&start_date=${startDate}&end_date=${endDate}&type=timesheets&deduct_breaks=${deductBreaks ? 1 : 0}&group_results=0&include_remote_sites=1&employee=all`;

  if (remoteSiteId) {
    url += `&remote_site=${encodeURIComponent(remoteSiteId)}`;
  }

  // Log with redacted token for debugging
  const redactedUrl = url.replace(/access_token=[^&]+/, 'access_token=***redacted***');
  console.log('[Humanity Payroll Report] Request URL:', redactedUrl);
  humanityLog('[Humanity API] Fetching payroll report:', { startDate, endDate, remoteSiteId, url: redactedUrl });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetchWithRetry(url, { signal: controller.signal });

    const rawData: any = await response.json();

    if (!response.ok) {
      console.error('[Humanity API] Payroll report request failed:', response.status, response.statusText);
      console.error('[Humanity API] Response data:', rawData);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }
    humanityLog('[Humanity API] Raw payroll report response status:', rawData.status);

    // Extract payroll data - filter out metadata fields which have string keys
    const payrollData = rawData.data || {};
    const numericKeyedData = Object.fromEntries(
      Object.entries(payrollData).filter(([key]) => /^\d+$/.test(key))
    );

    humanityLog('[Humanity API] Extracted numeric keys:', {
      totalKeys: Object.keys(payrollData).length,
      numericKeys: Object.keys(numericKeyedData).length,
    });

    const entriesPreCount = Object.values(numericKeyedData).length;
    const entriesPostFilterCount = Object.values(numericKeyedData)
      .filter((item: any) => {
        return item && typeof item === 'object' &&
          item.start_time && item.end_time && item.date;
      }).length;

    console.log('[Humanity Payroll Report] Entries processing:', {
      startDate,
      endDate,
      remoteSiteId: remoteSiteId || 'none',
      preFilterCount: entriesPreCount,
      postFilterCount: entriesPostFilterCount,
    });

    // Map raw payroll entries to typed HumanityPayrollReportEntry objects
    const entriesArray = Object.values(numericKeyedData)
      .filter((item: any) => {
        return item && typeof item === 'object' &&
          item.start_time && item.end_time && item.date;
      })
      .map((entry: any) => ({
        userid: entry.userid || '',
        employee: entry.employee || 'Unknown',
        eid: entry.eid || '',
        email: entry.email || '',
        date: entry.date || {
          formatted: '',
          timestamp: 0,
          month: 0,
          day: 0,
          year: 0,
          weekday: '',
        },
        out_date: entry.out_date || {
          formatted: '',
          timestamp: 0,
          month: 0,
          day: 0,
          year: 0,
        },
        start_time: entry.start_time || '',
        end_time: entry.end_time || '',
        hours: {
          regular: entry.hours?.regular || 0,
          special: entry.hours?.special || 0,
          overtime: entry.hours?.overtime || 0,
          d_overtime: entry.hours?.d_overtime || 0,
          total: entry.hours?.total || 0,
          cost: entry.hours?.cost || 0,
          breaks: entry.hours?.breaks || 0,
          rate: entry.hours?.rate || null,
          position: entry.hours?.position || {
            id: '',
            name: 'Unknown',
            active: '',
          },
          ratecard: entry.hours?.ratecard || {
            id: 0,
            name: '',
            pay_code: null,
            override_payroll: '',
          },
          location: entry.hours?.location || {
            id: '',
            name: '',
            address: '',
          },
          remote_site: entry.hours?.remote_site || null,
        },
        overnight: entry.overnight || false,
        clock: entry.clock || '',
        shift_title: entry.shift_title || '',
        in_location_name: entry.in_location_name || '',
        out_location_name: entry.out_location_name || '',
      }));

    humanityLog('[Humanity API] Converted to array, count:', entriesArray.length);
    if (entriesArray.length > 0) {
      humanityLog('[Humanity API] Sample payroll entry:', entriesArray[0]);
    }

    console.log('[Humanity Payroll Report] Final Result:', {
      startDate,
      endDate,
      remoteSiteId: remoteSiteId || 'none',
      totalEntries: entriesArray.length,
      uniqueEmployees: new Set(entriesArray.map(e => e.userid)).size,
      status: rawData.status,
    });

    clearTimeout(timeoutId);
    return {
      data: entriesArray,
      status: rawData.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Payroll report request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    throw error;
  }
}

/**
 * Fetch all timesheets from Humanity API (both confirmed and unconfirmed)
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 */
export async function fetchAllTimesheets(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<HumanityConfirmedTimesheetsResponse> {
  const url = `https://www.humanity.com/api/v2/reports/custom?access_token=${accessToken}&start_date=${startDate}&end_date=${endDate}&type=timesheets&fields=eid,schedule_name,total_time`;

  console.log('[Humanity API] Fetching all timesheets:', { startDate, endDate });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      console.error('[Humanity API] Request failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    console.log('[Humanity API] Raw timesheets response status:', rawData.status);

    // Extract shift data - filter out metadata fields which have string keys
    const shiftsData = rawData.data || {};
    const numericKeyedData = Object.fromEntries(
      Object.entries(shiftsData).filter(([key]) => /^\d+$/.test(key))
    );

    const shiftsArray = Object.values(numericKeyedData)
      .filter((item: any) => {
        return item && typeof item === 'object' && (
          item.eid || item.schedule_name || item.total_time
        );
      })
      .map((shift: any) => ({
        ...shift,
      }));

    console.log('[Humanity API] Converted to array, count:', shiftsArray.length);

    clearTimeout(timeoutId);
    return {
      data: shiftsArray,
      status: rawData.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    throw error;
  }
}

/**
 * Fetch confirmed shifts with minimal fields (eid and total_time only)
 * Optimized for annual hours evaluation - reduces processing time
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 */
export async function fetchConfirmedShiftsMinimal(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<HumanityConfirmedTimesheetsResponse> {
  const url = `https://www.humanity.com/api/v2/reports/custom?access_token=${accessToken}&start_date=${startDate}&end_date=${endDate}&type=confirmedshifts&fields=eid%2Ctotal_time%2Cschedule_name`;

  console.log('[Humanity API] Fetching confirmed shifts (minimal fields):', { startDate, endDate });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      console.error('[Humanity API] Request failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    console.log('[Humanity API] Raw confirmed shifts response status:', rawData.status);

    // Extract shift data - filter out metadata fields which have string keys
    const shiftsData = rawData.data || {};
    const numericKeyedData = Object.fromEntries(
      Object.entries(shiftsData).filter(([key]) => /^\d+$/.test(key))
    );

    const shiftsArray = Object.values(numericKeyedData)
      .filter((item: any) => {
        return item && typeof item === 'object' && (
          item.eid || item.total_time
        );
      })
      .filter((item: any) => {
        const name = ((item.schedule_name as string) || '').toLowerCase();
        return !['admin', 'dispatch', 'training'].some(term => name.includes(term));
      })
      .map((shift: any) => ({
        eid: shift.eid,
        total_time: shift.total_time,
        schedule_name: shift.schedule_name,
      }));

    console.log('[Humanity API] Converted to array, count:', shiftsArray.length);

    clearTimeout(timeoutId);
    return {
      data: shiftsArray,
      status: rawData.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    throw error;
  }
}

/**
 * Fetch scheduled shifts from Humanity API
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 */
export async function fetchScheduledShifts(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<HumanityConfirmedTimesheetsResponse> {
  const url = `https://www.humanity.com/api/v2/reports/custom?access_token=${accessToken}&start_date=${startDate}&end_date=${endDate}&type=shifts&fields=employee,schedule_name,total_time`;

  // Check cache first
  const cacheKey = getCacheKey(url);
  const cached = getCached<HumanityConfirmedTimesheetsResponse>(cacheKey);
  if (cached) {
    humanityLog('[Humanity API] Returning cached scheduled shifts:', { startDate, endDate });
    return cached;
  }

  console.log('[Humanity API] Fetching scheduled shifts:', { startDate, endDate });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetchWithRetry(url, { signal: controller.signal });

    if (!response.ok) {
      console.error('[Humanity API] Request failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    console.log('[Humanity API] Raw scheduled shifts response status:', rawData.status);

    // Extract shift data - the API returns shifts with numeric keys
    // Filter out metadata fields which have string keys like 'token', 'method', etc.
    const shiftsData = rawData.data || {};
    const numericKeyedData = Object.fromEntries(
      Object.entries(shiftsData).filter(([key]) => /^\d+$/.test(key))
    );

    console.log('[Humanity API] Extracted numeric keys:', {
      totalKeys: Object.keys(shiftsData).length,
      numericKeys: Object.keys(numericKeyedData).length,
      sampleNumericKeys: Object.keys(numericKeyedData).slice(0, 5),
    });

    const shiftsArray = Object.values(numericKeyedData)
      .filter((item: any) => {
        return item && typeof item === 'object' && (
          item.employee || item.schedule_name
        );
      })
      .map((shift: any) => ({
        ...shift,
      }));

    console.log('[Humanity API] Converted to array, count:', shiftsArray.length);

    const result = {
      data: shiftsArray,
      status: rawData.status,
    };

    // Cache the result
    setCached(cacheKey, result);

    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    throw error;
  }
}

/**
 * Fetch shifts for a specific employee using the Shifts API endpoint
 * @param accessToken - Humanity API access token
 * @param employeeId - The internal employee ID
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 */
export async function fetchEmployeeShifts(
  accessToken: string,
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<HumanityConfirmedTimesheetsResponse> {
  const url = `https://www.humanity.com/api/v2/shifts?filter_by_employee=${employeeId}&start_date=${startDate}&end_date=${endDate}&access_token=${accessToken}`;

  console.log('[Humanity API] Fetching employee shifts:', { employeeId, startDate, endDate });

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Shifts fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const rawData: any = await response.json();
  console.log('[Humanity API] Raw shifts response status:', rawData.status);
  console.log('[Humanity API] Shifts data count:', Array.isArray(rawData.data) ? rawData.data.length : 0);

  if (Array.isArray(rawData.data) && rawData.data.length > 0) {
    console.log('[Humanity API] Sample shift:', rawData.data[0]);
  }

  // The Shifts API returns data as an array directly
  const shiftsArray = (Array.isArray(rawData.data) ? rawData.data : []).map((shift: any) => ({
    ...shift,
    shift_title: shift.title || shift.shift_title,
  }));

  console.log('[Humanity API] Processed shifts count:', shiftsArray.length);

  return {
    data: shiftsArray,
    status: rawData.status || 1,
  };
}

/**
 * Fetch employee details by EID from Humanity API
 */
export async function fetchEmployeeDetails(
  accessToken: string,
  eid: string
): Promise<HumanityEmployeeResponse> {
  const url = `https://www.humanity.com/api/v2/employees/eid/${eid}?access_token=${accessToken}`;

  console.log('[Humanity API] Fetching employee details:', { eid });

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    console.error('[Humanity API] Employee fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const rawData = await response.json();
  console.log('[Humanity API] Employee response:', JSON.stringify(rawData, null, 2));

  // Process the response - Humanity API typically returns { data: { employee_data } }
  // Filter out no_avatar placeholders and convert relative URLs to absolute
  if (rawData.data?.photo && typeof rawData.data.photo === 'string') {
    if (rawData.data.photo.includes('no_avatar')) {
      rawData.data.photo = null;
    } else if (!rawData.data.photo.startsWith('http')) {
      rawData.data.photo = `https://www.humanity.com${rawData.data.photo}`;
    }
  }

  // Handle avatar - it can be a string or an object with multiple sizes
  if (rawData.data?.avatar) {
    if (typeof rawData.data.avatar === 'string') {
      if (rawData.data.avatar.includes('no_avatar')) {
        rawData.data.avatar = null;
      } else if (!rawData.data.avatar.startsWith('http')) {
        rawData.data.avatar = `https://www.humanity.com${rawData.data.avatar}`;
      }
    } else if (typeof rawData.data.avatar === 'object') {
      // Filter out no_avatar URLs from avatar object
      if (rawData.data.avatar.small?.includes('no_avatar')) {
        rawData.data.avatar.small = undefined;
      }
      if (rawData.data.avatar.medium?.includes('no_avatar')) {
        rawData.data.avatar.medium = undefined;
      }
      if (rawData.data.avatar.large?.includes('no_avatar')) {
        rawData.data.avatar.large = undefined;
      }
      // If all avatar sizes were removed, set avatar to null
      if (!rawData.data.avatar.small && !rawData.data.avatar.medium && !rawData.data.avatar.large) {
        rawData.data.avatar = null;
      }
    }
  }

  return rawData;
}

/**
 * Format date to Humanity API format (YYYY-MM-DD)
 */
export function formatDateForHumanity(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get default date range (current month)
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: formatDateForHumanity(firstDay),
    endDate: formatDateForHumanity(lastDay),
  };
}

/**
 * Fetch all employees from Humanity API
 */
export async function fetchAllEmployees(
  accessToken: string
): Promise<HumanityEmployeesListResponse> {
  const url = `https://www.humanity.com/api/v2/employees?access_token=${accessToken}`;

  console.log('[Humanity API] Fetching all employees');

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Employee list fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const rawData = await response.json();
  console.log('[Humanity API] Employees response status:', rawData.status);
  console.log('[Humanity API] Employees count:', rawData.data?.length || 0);

  return {
    status: rawData.status,
    data: rawData.data || [],
  };
}

/**
 * Fetch employee by ID from Humanity API
 * @param accessToken - Humanity API access token
 * @param employeeId - The internal employee ID
 */
export async function fetchEmployeeById(
  accessToken: string,
  employeeId: string
): Promise<HumanityEmployeeResponse> {
  const url = `https://www.humanity.com/api/v2/employees/${employeeId}?access_token=${accessToken}`;

  console.log('[Humanity API] Fetching employee by ID:', { employeeId });

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Employee fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const rawData = await response.json();
  console.log('[Humanity API] Employee response status:', rawData.status);

  // Process avatar/photo like in fetchEmployeeDetails
  if (rawData.data?.photo && typeof rawData.data.photo === 'string') {
    if (rawData.data.photo.includes('no_avatar')) {
      rawData.data.photo = null;
    } else if (!rawData.data.photo.startsWith('http')) {
      rawData.data.photo = `https://www.humanity.com${rawData.data.photo}`;
    }
  }

  if (rawData.data?.avatar) {
    if (typeof rawData.data.avatar === 'string') {
      if (rawData.data.avatar.includes('no_avatar')) {
        rawData.data.avatar = null;
      } else if (!rawData.data.avatar.startsWith('http')) {
        rawData.data.avatar = `https://www.humanity.com${rawData.data.avatar}`;
      }
    }
  }

  return {
    status: rawData.status,
    data: rawData.data,
  };
}

/**
 * Fetch employee by external EID from Humanity API
 * @param accessToken - Humanity API access token
 * @param eid - The external employee ID (ADP/EID)
 */
export async function fetchEmployeeByEid(
  accessToken: string,
  eid: string
): Promise<{ address?: string; city?: string; zip?: string; state?: string; ssn?: string; phone?: string; email?: string; mobilePhone?: string; birthDate?: string } | null> {
  const url = `https://www.humanity.com/api/v2/employees/eid/${encodeURIComponent(eid)}?access_token=${accessToken}`

  console.log('[Humanity API] Fetching employee by EID:', { eid })

  const response = await fetch(url)

  if (!response.ok) {
    console.warn('[Humanity API] Employee EID fetch failed:', response.status, response.statusText)
    return null
  }

  const rawData = await response.json()
  if (!rawData.data) return null

  const emp = rawData.data
  let city = emp.city || undefined
  let state = emp.state || emp.province || undefined

  // Fix for Humanity data entry errors: if city is a Canadian province name,
  // swap city and state (Alberta, BC, Ontario, etc. should never be city names)
  const canadianProvinces = ['Alberta', 'British Columbia', 'BC', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon']
  if (city && canadianProvinces.includes(city)) {
    // City contains a province name, so swap them
    const temp = city
    city = state
    state = temp
  }

  return {
    address: emp.address || emp.home_address || undefined,
    city: city,
    zip: emp.zip || emp.postal_code || undefined,
    state: state,
    ssn: emp.ssn || emp.social_security_number || undefined,
    phone: emp.phone || emp.phone_number || undefined,
    email: emp.email || emp.email_address || undefined,
    mobilePhone: emp.mobile || emp.mobile_phone || undefined,
    birthDate: emp.birth_date || emp.dob || undefined,
  }
}

/**
 * Fetch employee positions and wages from Humanity API
 * @param accessToken - Humanity API access token
 * @param employeeId - The internal employee ID (not EID)
 */
export async function fetchEmployeePositions(
  accessToken: string,
  employeeId: string
): Promise<HumanityEmployeePositionsResponse> {
  const url = `https://www.humanity.com/api/v2/employees/${employeeId}/positions?access_token=${accessToken}`;

  console.log('[Humanity API] Fetching employee positions:', { employeeId });

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Employee positions fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const rawData = await response.json();
  console.log('[Humanity API] Positions response:', JSON.stringify(rawData, null, 2));

  return {
    status: rawData.status,
    data: rawData.data || [],
  };
}

/**
 * Update employee details in Humanity API
 * @param accessToken - Humanity API access token
 * @param employeeId - The internal employee ID
 * @param data - Employee data to update
 */
export async function updateEmployee(
  accessToken: string,
  employeeId: string,
  data: UpdateEmployeeRequest
): Promise<HumanityEmployeeResponse> {
  // Include access_token in query string like GET requests do
  const url = `https://www.humanity.com/api/v2/employees/${employeeId}?access_token=${accessToken}`;

  console.log('[Humanity API] Updating employee:', {
    employeeId,
    data,
    tokenLength: accessToken?.length,
    tokenPrefix: accessToken?.substring(0, 10)
  });

  const formData = new URLSearchParams();

  // Add all update fields to form data (no token in body, it's in URL)
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'custom' && typeof value === 'object') {
        // Handle custom fields
        Object.entries(value).forEach(([customKey, customValue]) => {
          formData.append(`custom[${customKey}]`, customValue as string);
        });
      } else {
        formData.append(key, String(value));
      }
    }
  });

  console.log('[Humanity API] Form data keys before send:', Array.from(formData.keys()));

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const rawData = await response.json();
  console.log('[Humanity API] Employee update response:', JSON.stringify(rawData, null, 2));

  if (!response.ok) {
    console.error('[Humanity API] Employee update failed:', {
      status: response.status,
      statusText: response.statusText,
      responseData: rawData
    });
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  return rawData;
}

/**
 * Update employee position wage in Humanity API
 * @param accessToken - Humanity API access token
 * @param employeeId - The internal employee ID
 * @param positionId - The position ID
 * @param data - Position data to update (wage)
 */
export async function updateEmployeePosition(
  accessToken: string,
  employeeId: string,
  positionId: string,
  data: UpdateEmployeePositionRequest
): Promise<{ status: number; data: unknown }> {
  // Include access_token in query string like GET requests do
  const url = `https://www.humanity.com/api/v2/employees/${employeeId}/positions/${positionId}?access_token=${accessToken}`;

  console.log('[Humanity API] Updating employee position:', { employeeId, positionId, data });

  const formData = new URLSearchParams();
  formData.append('wage', String(data.wage));

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const rawData = await response.json();
  console.log('[Humanity API] Position update response:', JSON.stringify(rawData, null, 2));

  if (!response.ok) {
    console.error('[Humanity API] Position update failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  return rawData;
}

/**
 * Fetch all positions from Humanity API
 */
export async function fetchAllPositions(
  accessToken: string
): Promise<HumanityPositionsResponse> {
  const url = `https://www.humanity.com/api/v2/positions?access_token=${accessToken}`;

  console.log('[Humanity API] Fetching all positions');

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Positions list fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const rawData = await response.json();
  console.log('[Humanity API] Positions response status:', rawData.status);
  console.log('[Humanity API] Positions count:', rawData.data?.length || 0);

  return {
    status: rawData.status,
    data: rawData.data || [],
  };
}

/**
 * Fetch shifts from Humanity API
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 */
export async function fetchShifts(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const url = `https://www.humanity.com/api/v2/shifts?start_date=${startDate}&end_date=${endDate}&access_token=${accessToken}`;

  console.log('[Humanity API] Fetching shifts:', { startDate, endDate });

  // Add timeout to prevent indefinite hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10 second timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[Humanity API] Shifts fetch failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Humanity API] Shifts response status:', data.status);
    console.log('[Humanity API] Shifts count:', Array.isArray(data.data) ? data.data.length : 0);

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Humanity API timeout after 10s');
    }
    throw err;
  }
}

/**
 * Fetch shifts custom report to extract remote_site and total_time
 * Used by Shift Validator to supplement /api/v2/shifts endpoint
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 * @returns Map keyed by shift_id with remote_site and total_time
 */
export async function fetchShiftsCustomReport(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<Map<string, { remote_site: string | null; total_time: number | null }>> {
  const fields = 'shift_id,schedule_id,schedule_name,location,rate,start_day,end_day,remote_site,total_time';
  const url = `https://www.humanity.com/api/v2/reports/custom?type=shifts&fields=${encodeURIComponent(fields)}&start_date=${startDate}&end_date=${endDate}&access_token=${accessToken}`;

  console.log('[Humanity API] Fetching shifts custom report:', { startDate, endDate });

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Custom report fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[Humanity API] Custom report response status:', data.status);

  // Build lookup map keyed by schedule_id (matches shift.schedule field)
  const lookupMap = new Map<string, { remote_site: string | null; total_time: number | null }>();

  // Extract rows from object with numeric keys, filtering out 'custom_report' metadata
  const rows = Object.entries(data.data as Record<string, any>)
    .filter(([key]) => key !== 'custom_report')
    .map(([, row]) => row);

  console.log('[Humanity API] Custom report row count:', rows.length);

  rows.forEach((row: any) => {
    // Use schedule_id as the key (matches shift.schedule field from /api/v2/shifts)
    const scheduleId = String(row.schedule_id || '');
    if (!scheduleId) return;

    lookupMap.set(scheduleId, {
      remote_site: row.remote_site || null,
      total_time: row.total_time ? parseFloat(String(row.total_time)) : null,
    });
  });

  console.log('[Humanity API] Custom report lookup map size:', lookupMap.size);

  return lookupMap;
}

/**
 * Fetch detailed shift data from Humanity API with ?detailed=1 parameter
 * Step 2 of Shift Sync: Get detailed view of individual shift
 * @param shiftId - The shift ID from Humanity API
 * @param accessToken - Humanity API access token
 */
export async function fetchShiftDetails(
  shiftId: string,
  accessToken: string
): Promise<any> {
  const url = `https://www.humanity.com/api/v2/shifts/${shiftId}?detailed=1&access_token=${accessToken}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`[Humanity API] Failed to fetch shift ${shiftId}:`, response.status, response.statusText);
    throw new Error(`Failed to fetch shift ${shiftId}`);
  }

  return response.json();
}

/**
 * Extract employee IDs and EIDs from detailed shift response
 * Step 3 of Shift Sync: Create comma list of Employees
 * @param detailedShift - The detailed shift response from Humanity API
 * @returns Object with comma-separated employee IDs and EIDs
 */
export function extractEmployeeData(detailedShift: any): { ids: string; eids: string } {
  const employees = detailedShift.data?.employees || [];

  const ids = employees
    .map((emp: any) => String(emp.id))
    .filter(Boolean)
    .join(', ');

  const eids = employees
    .map((emp: any) => String(emp.eid))
    .filter(Boolean)
    .join(', ');

  return { ids, eids };
}

/**
 * Extract skill IDs from detailed shift response
 * Step 4 of Shift Sync: Create comma list of Skills
 * @param detailedShift - The detailed shift response from Humanity API
 * @returns Comma-separated skill/position IDs
 */
export function extractSkillIds(detailedShift: any): string {
  const skills = detailedShift.data?.skills || detailedShift.data?.positions || [];

  return skills
    .map((skill: any) => String(skill.id))
    .filter(Boolean)
    .join(', ');
}

/**
 * Calculate shift duration and overtime hours
 * @param startDate - Shift start date (YYYY-MM-DD format)
 * @param startTime - Shift start time (HH:MM or HH:MM:SS format)
 * @param endDate - Shift end date (YYYY-MM-DD format)
 * @param endTime - Shift end time (HH:MM or HH:MM:SS format)
 * @param breakMinutes - Break duration in minutes (default: 0)
 * @returns Object with total and overtime hours
 */
export function calculateShiftHours(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  breakMinutes = 0
): { total: number; overtime: number } {
  try {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60) - breakMinutes;
    const totalHours = totalMinutes / 60;
    const overtime = Math.max(0, totalHours - 8); // Overtime after 8 hours

    return { total: Math.round(totalHours * 100) / 100, overtime: Math.round(overtime * 100) / 100 };
  } catch (error) {
    console.error('[Humanity API] Error calculating shift hours:', { startDate, startTime, endDate, endTime, error });
    return { total: 0, overtime: 0 };
  }
}

/**
 * Delete a location from Humanity
 * @param locationId - The Humanity location ID to delete
 * @param accessToken - Humanity access token
 */
export async function deleteHumanityLocation(
  locationId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://www.humanity.com/api/v2/locations/${locationId}?access_token=${accessToken}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[Humanity API] Failed to delete location ${locationId}:`, errorData)
      return { success: false, error: `HTTP ${response.status}: ${errorData}` }
    }

    console.log(`[Humanity API] Successfully deleted location ${locationId}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("[Humanity API] Error deleting location:", error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Delete an employee from Humanity
 * @param employeeId - The Humanity employee ID to delete
 * @param accessToken - Humanity access token
 */
export async function deleteHumanityEmployee(
  employeeId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://www.humanity.com/api/v2/employees/${employeeId}?access_token=${accessToken}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[Humanity API] Failed to delete employee ${employeeId}:`, errorData)
      return { success: false, error: `HTTP ${response.status}: ${errorData}` }
    }

    console.log(`[Humanity API] Successfully deleted employee ${employeeId}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("[Humanity API] Error deleting employee:", error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Delete a position from Humanity
 * @param positionId - The Humanity position ID to delete
 * @param accessToken - Humanity access token
 */
export async function deleteHumanityPosition(
  positionId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://www.humanity.com/api/v2/positions/${positionId}?access_token=${accessToken}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[Humanity API] Failed to delete position ${positionId}:`, errorData)
      return { success: false, error: `HTTP ${response.status}: ${errorData}` }
    }

    console.log(`[Humanity API] Successfully deleted position ${positionId}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("[Humanity API] Error deleting position:", error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Utility function for rate limiting delays
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for locations in Humanity by name
 * @param searchTerm - The search term to find locations
 * @param accessToken - Humanity access token
 * @returns Array of matching locations
 */
export async function searchHumanityLocations(
  searchTerm: string,
  accessToken: string
): Promise<Array<{ id: string; name: string; address?: string; city?: string; state?: string; postal_code?: string }>> {
  try {
    const url = `https://www.humanity.com/api/v2/locations?access_token=${accessToken}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Humanity Search] API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()
    const locations = data.data || []

    // Filter locations by search term (case-insensitive)
    const searchLower = searchTerm.toLowerCase()
    return locations.filter((location: any) =>
      location.name?.toLowerCase().includes(searchLower) ||
      location.address_line_1?.toLowerCase().includes(searchLower) ||
      location.city?.toLowerCase().includes(searchLower)
    ).map((location: any) => ({
      id: location.id,
      name: location.name || '',
      address: location.address_line_1 || undefined,
      city: location.city || undefined,
      state: location.state || undefined,
      postal_code: location.postal_code || undefined,
    }))
  } catch (error) {
    console.error('[Humanity Search] Error searching locations:', error)
    return []
  }
}

/**
 * Fetch timeclocks for a specific shift/schedule from Humanity API
 * @param accessToken - Humanity API access token
 * @param scheduleId - The schedule/shift ID to fetch timeclocks for
 * @returns HumanityTimeclocksResponse with timeclock entries
 */
export async function fetchTimeclocksForSchedule(
  accessToken: string,
  scheduleId: string,
  startDate?: string,
  endDate?: string
): Promise<HumanityTimeclocksResponse> {
  let url = `https://www.humanity.com/api/v2/timeclocks?schedule=${scheduleId}&access_token=${accessToken}`;

  // Add date filtering if provided
  if (startDate) {
    url += `&start_date=${startDate}`;
  }
  if (endDate) {
    url += `&end_date=${endDate}`;
  }

  console.log('[Humanity API] Fetching timeclocks for schedule:', { scheduleId, startDate, endDate });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      console.error('[Humanity API] Timeclocks fetch failed:', response.status, response.statusText);
      throw new Error(`Humanity API error: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    console.log('[Humanity API] Timeclocks response status:', rawData.status);
    console.log('[Humanity API] Timeclocks count:', rawData.data?.length || 0);

    clearTimeout(timeoutId);

    return {
      status: rawData.status || 1,
      data: Array.isArray(rawData.data) ? rawData.data : [],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Humanity API] Timeclocks request timeout after 30 seconds');
      throw new Error('Humanity API request timed out');
    }
    console.error('[Humanity API] Error fetching timeclocks:', error);
    throw error;
  }
}

/**
 * Fetch shifts custom report for timesheet validator (only needed fields)
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 * @returns Array of shift rows
 */
export async function fetchShiftsReport(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const fields = 'employee,eid,schedule_id,schedule_name,location,start_day,end_day,start_time,end_time,total_time,title,notes';
  const url = `https://www.humanity.com/api/v2/reports/custom?type=shifts&fields=${encodeURIComponent(fields)}&start_date=${startDate}&end_date=${endDate}&access_token=${accessToken}`;

  console.log('[Humanity API] Fetching shifts report:', { startDate, endDate });

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Shifts report fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[Humanity API] Shifts report response status:', data.status);

  // Extract rows from object with numeric keys, filtering out 'custom_report' metadata
  const rows = Object.entries(data.data as Record<string, any>)
    .filter(([key]) => key !== 'custom_report')
    .map(([, row]) => row);

  console.log('[Humanity API] Shifts report row count:', rows.length);
  return rows;
}

/**
 * Fetch timesheets custom report for timesheet validator
 * @param accessToken - Humanity API access token
 * @param startDate - Format: YYYY-MM-DD
 * @param endDate - Format: YYYY-MM-DD
 * @returns Array of timesheet rows
 */
export async function fetchTimesheetsReport(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const fields = 'employee,eid,location,schedule_id,schedule_name,start_day,end_day,start_time,end_time,total_time,rate,overtime,cost,notes';
  const url = `https://www.humanity.com/api/v2/reports/custom?type=confirmedtimesheets&fields=${encodeURIComponent(fields)}&start_date=${startDate}&end_date=${endDate}&access_token=${accessToken}`;

  console.log('[Humanity API] Fetching timesheets report:', { startDate, endDate });

  const response = await fetch(url);

  if (!response.ok) {
    console.error('[Humanity API] Timesheets report fetch failed:', response.status, response.statusText);
    throw new Error(`Humanity API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[Humanity API] Timesheets report response status:', data.status);

  // Extract rows from object with numeric keys, filtering out 'custom_report' metadata
  const rows = Object.entries(data.data as Record<string, any>)
    .filter(([key]) => key !== 'custom_report')
    .map(([, row]) => row);

  console.log('[Humanity API] Timesheets report row count:', rows.length);
  return rows;
}
