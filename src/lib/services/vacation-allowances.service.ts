/**
 * Vacation Allowances Service
 * Handles business logic for user vacation allowances operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  VacationAllowanceDTO,
  GetVacationAllowancesResponseDTO,
  GetVacationAllowanceByYearResponseDTO,
} from "@/types";

/**
 * Helper function to calculate used days from vacation requests
 * Implements the carry-over logic:
 * - Carry-over days expire on March 31st of the year
 * - Days are used in order: carry-over first, then current year days
 * - Only APPROVED requests count towards used days
 *
 * @param allowance - Vacation allowance record
 * @param vacationRequests - List of vacation requests for the user in the given year
 * @returns Object with used days breakdown
 */
function calculateUsedDays(
  allowance: { year: number; carryover_days: number },
  vacationRequests: Array<{ start_date: string; business_days_count: number; status: string }>
): {
  usedCarryoverDays: number;
  usedCurrentYearDays: number;
  usedDays: number;
} {
  const carryoverExpiresAt = `${allowance.year}-03-31`;
  let usedCarryoverDays = 0;
  let usedCurrentYearDays = 0;

  // Sort requests by start date (earliest first)
  const sortedRequests = vacationRequests
    .filter((req) => req.status === "APPROVED")
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  let remainingCarryover = allowance.carryover_days;

  for (const request of sortedRequests) {
    const daysNeeded = request.business_days_count;

    // If request starts before or on March 31st and we have carryover days available
    if (request.start_date <= carryoverExpiresAt && remainingCarryover > 0) {
      const usedFromCarryover = Math.min(daysNeeded, remainingCarryover);
      usedCarryoverDays += usedFromCarryover;
      remainingCarryover -= usedFromCarryover;

      const remainingDays = daysNeeded - usedFromCarryover;
      if (remainingDays > 0) {
        usedCurrentYearDays += remainingDays;
      }
    } else {
      // After March 31st or no carryover left - use current year days
      usedCurrentYearDays += daysNeeded;
    }
  }

  return {
    usedCarryoverDays,
    usedCurrentYearDays,
    usedDays: usedCarryoverDays + usedCurrentYearDays,
  };
}

/**
 * Helper function to enrich allowance with computed fields
 *
 * @param allowance - Raw allowance from database
 * @param vacationRequests - Vacation requests for calculations
 * @returns Enriched VacationAllowanceDTO
 */
function enrichAllowanceWithComputedFields(
  allowance: {
    id: string;
    user_id: string;
    year: number;
    total_days: number;
    carryover_days: number;
    created_at: string;
    updated_at: string;
  },
  vacationRequests: Array<{ start_date: string; business_days_count: number; status: string }>
): VacationAllowanceDTO {
  // Calculate used days with carry-over logic
  const { usedCarryoverDays, usedCurrentYearDays, usedDays } = calculateUsedDays(
    allowance,
    vacationRequests
  );

  // Calculate remaining days
  const remainingCarryoverDays = Math.max(0, allowance.carryover_days - usedCarryoverDays);
  const remainingCurrentYearDays = Math.max(0, allowance.total_days - usedCurrentYearDays);
  const remainingDays = remainingCarryoverDays + remainingCurrentYearDays;

  return {
    id: allowance.id,
    userId: allowance.user_id,
    year: allowance.year,
    totalDays: allowance.total_days,
    carryoverDays: allowance.carryover_days,
    usedDays,
    usedCarryoverDays,
    usedCurrentYearDays,
    remainingDays,
    remainingCarryoverDays,
    remainingCurrentYearDays,
    carryoverExpiresAt: `${allowance.year}-03-31`,
    createdAt: allowance.created_at,
    updatedAt: allowance.updated_at,
  };
}

/**
 * Get vacation allowances for a user with optional year filter
 * Implements RBAC (Role-Based Access Control):
 * - EMPLOYEE: Can only view their own allowances
 * - HR: Can view allowances from active users only
 * - ADMINISTRATOR: Can view all allowances (including deleted users)
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user
 * @param currentUserRole - Role of the current user
 * @param targetUserId - ID of the user whose allowances to retrieve
 * @param year - Optional year filter
 * @returns Promise with vacation allowances data
 * @throws Error if user not found, deleted, or insufficient permissions
 */
export async function getVacationAllowances(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  targetUserId: string,
  year?: number
): Promise<GetVacationAllowancesResponseDTO> {
  // 1. Check authorization - EMPLOYEE can only view own allowances
  if (currentUserRole === "EMPLOYEE" && currentUserId !== targetUserId) {
    throw new Error("Forbidden: You can only view your own vacation allowances");
  }

  // 2. Verify target user exists and check soft-delete status
  const { data: targetUser, error: userError } = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", targetUserId)
    .single();

  if (userError || !targetUser) {
    console.error("[VacationAllowancesService] User not found:", userError);
    throw new Error("User not found");
  }

  // 3. Check if user is soft-deleted (only ADMINISTRATOR can access deleted users)
  if (targetUser.deleted_at && currentUserRole !== "ADMINISTRATOR") {
    throw new Error("Forbidden: Cannot access vacation allowances for deleted user");
  }

  // 4. Fetch vacation allowances for the user
  let allowancesQuery = supabase
    .from("vacation_allowances")
    .select("*")
    .eq("user_id", targetUserId)
    .order("year", { ascending: false });

  // Apply year filter if provided
  if (year !== undefined) {
    allowancesQuery = allowancesQuery.eq("year", year);
  }

  const { data: allowances, error: allowancesError } = await allowancesQuery;

  if (allowancesError) {
    console.error("[VacationAllowancesService] Failed to fetch allowances:", allowancesError);
    throw new Error("Failed to fetch vacation allowances");
  }

  if (!allowances || allowances.length === 0) {
    // Return empty array instead of throwing error
    return {
      userId: targetUserId,
      allowances: [],
    };
  }

  // 5. Fetch vacation requests for all years in the allowances
  const years = allowances.map((a) => a.year);
  const { data: vacationRequests, error: requestsError } = await supabase
    .from("vacation_requests")
    .select("start_date, end_date, business_days_count, status")
    .eq("user_id", targetUserId)
    .gte("start_date", `${Math.min(...years)}-01-01`)
    .lte("end_date", `${Math.max(...years)}-12-31`);

  if (requestsError) {
    console.error("[VacationAllowancesService] Failed to fetch vacation requests:", requestsError);
    throw new Error("Failed to calculate used vacation days");
  }

  // 6. Enrich each allowance with computed fields
  const enrichedAllowances = allowances.map((allowance) => {
    // Filter requests for this specific year
    const yearRequests = (vacationRequests || []).filter((req) => {
      const requestYear = new Date(req.start_date).getFullYear();
      return requestYear === allowance.year;
    });

    return enrichAllowanceWithComputedFields(allowance, yearRequests);
  });

  return {
    userId: targetUserId,
    allowances: enrichedAllowances,
  };
}

/**
 * Get vacation allowance for a specific year
 * Implements RBAC (Role-Based Access Control):
 * - EMPLOYEE: Can only view their own allowances
 * - HR: Can view allowances from active users only
 * - ADMINISTRATOR: Can view all allowances (including deleted users)
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user
 * @param currentUserRole - Role of the current user
 * @param targetUserId - ID of the user whose allowance to retrieve
 * @param year - Year of the allowance to retrieve
 * @returns Promise with vacation allowance data
 * @throws Error if user not found, allowance not found, or insufficient permissions
 */
export async function getVacationAllowanceByYear(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  targetUserId: string,
  year: number
): Promise<GetVacationAllowanceByYearResponseDTO> {
  // 1. Check authorization - EMPLOYEE can only view own allowances
  if (currentUserRole === "EMPLOYEE" && currentUserId !== targetUserId) {
    throw new Error("Forbidden: You can only view your own vacation allowances");
  }

  // 2. Verify target user exists and check soft-delete status
  const { data: targetUser, error: userError } = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", targetUserId)
    .single();

  if (userError || !targetUser) {
    console.error("[VacationAllowancesService] User not found:", userError);
    throw new Error("User not found");
  }

  // 3. Check if user is soft-deleted (only ADMINISTRATOR can access deleted users)
  if (targetUser.deleted_at && currentUserRole !== "ADMINISTRATOR") {
    throw new Error("Forbidden: Cannot access vacation allowances for deleted user");
  }

  // 4. Fetch vacation allowance for the specific year
  const { data: allowance, error: allowanceError } = await supabase
    .from("vacation_allowances")
    .select("*")
    .eq("user_id", targetUserId)
    .eq("year", year)
    .single();

  if (allowanceError || !allowance) {
    console.error("[VacationAllowancesService] Allowance not found:", allowanceError);
    throw new Error(`Vacation allowance for year ${year} not found`);
  }

  // 5. Fetch vacation requests for this year
  const { data: vacationRequests, error: requestsError } = await supabase
    .from("vacation_requests")
    .select("start_date, end_date, business_days_count, status")
    .eq("user_id", targetUserId)
    .gte("start_date", `${year}-01-01`)
    .lte("end_date", `${year}-12-31`);

  if (requestsError) {
    console.error("[VacationAllowancesService] Failed to fetch vacation requests:", requestsError);
    throw new Error("Failed to calculate used vacation days");
  }

  // 6. Enrich allowance with computed fields
  const enrichedAllowance = enrichAllowanceWithComputedFields(
    allowance,
    vacationRequests || []
  );

  return {
    data: enrichedAllowance,
  };
}

