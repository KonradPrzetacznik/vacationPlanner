/**
 * Vacation Allowances Service
 * Handles business logic for user vacation allowances operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  VacationAllowanceDTO,
  GetVacationAllowancesResponseDTO,
  GetVacationAllowanceByYearResponseDTO,
  CreateVacationAllowanceDTO,
  CreateVacationAllowanceResponseDTO,
  UpdateVacationAllowanceDTO,
  UpdateVacationAllowanceResponseDTO,
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
  vacationRequests: { start_date: string; business_days_count: number; status: string }[]
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
  vacationRequests: { start_date: string; business_days_count: number; status: string }[]
): VacationAllowanceDTO {
  // Calculate used days with carry-over logic
  const { usedCarryoverDays, usedCurrentYearDays, usedDays } = calculateUsedDays(allowance, vacationRequests);

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
    throw new Error("Failed to calculate used vacation days");
  }

  // 6. Enrich allowance with computed fields
  const enrichedAllowance = enrichAllowanceWithComputedFields(allowance, vacationRequests || []);

  return {
    data: enrichedAllowance,
  };
}

/**
 * Create a new vacation allowance for a user
 * Only HR users can create vacation allowances
 * Implements business logic:
 * - Verifies user exists and is not soft-deleted
 * - Ensures uniqueness of user_id + year combination
 * - Automatically sets carryover_expires_at to March 31st of the year
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (for authorization)
 * @param currentUserRole - Role of the current user
 * @param data - Vacation allowance data to create
 * @returns Promise with created vacation allowance
 * @throws Error if unauthorized, user not found, user deleted, or duplicate exists
 */
export async function createVacationAllowance(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  data: CreateVacationAllowanceDTO
): Promise<CreateVacationAllowanceResponseDTO> {
  // 1. Check authorization - only HR can create vacation allowances
  if (currentUserRole !== "HR") {
    throw new Error("Only HR users can create vacation allowances");
  }

  // 2. Verify target user exists and is not soft-deleted
  const { data: targetUser, error: userError } = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", data.userId)
    .single();

  if (userError || !targetUser) {
    throw new Error("User not found");
  }

  if (targetUser.deleted_at) {
    throw new Error("Cannot create vacation allowance for deleted user");
  }

  // 3. Check for duplicate (user_id + year combination must be unique)
  const { data: existingAllowance, error: duplicateError } = await supabase
    .from("vacation_allowances")
    .select("id")
    .eq("user_id", data.userId)
    .eq("year", data.year)
    .maybeSingle();

  if (duplicateError) {
    throw new Error("Failed to create vacation allowance");
  }

  if (existingAllowance) {
    throw new Error("Vacation allowance for this user and year already exists");
  }

  // 4. Insert new vacation allowance
  // Note: carryover_expires_at is not stored in DB - it's calculated dynamically as March 31st
  const { data: createdAllowance, error: insertError } = await supabase
    .from("vacation_allowances")
    .insert({
      user_id: data.userId,
      year: data.year,
      total_days: data.totalDays,
      carryover_days: data.carryoverDays,
    })
    .select("id, user_id, year, total_days, carryover_days, created_at")
    .single();

  if (insertError || !createdAllowance) {
    throw new Error("Failed to create vacation allowance");
  }

  // 5. Return response DTO
  return {
    id: createdAllowance.id,
    userId: createdAllowance.user_id,
    year: createdAllowance.year,
    totalDays: createdAllowance.total_days,
    carryoverDays: createdAllowance.carryover_days,
    createdAt: createdAllowance.created_at,
  };
}

/**
 * Update an existing vacation allowance
 * Only HR users can update vacation allowances
 * At least one field (totalDays or carryoverDays) must be provided
 *
 * @param supabase - Supabase client from context.locals
 * @param currentUserId - ID of the current user (for authorization)
 * @param currentUserRole - Role of the current user
 * @param allowanceId - ID of the vacation allowance to update
 * @param data - Fields to update
 * @returns Promise with updated vacation allowance
 * @throws Error if unauthorized or allowance not found
 */
export async function updateVacationAllowance(
  supabase: SupabaseClient,
  currentUserId: string,
  currentUserRole: "ADMINISTRATOR" | "HR" | "EMPLOYEE",
  allowanceId: string,
  data: UpdateVacationAllowanceDTO
): Promise<UpdateVacationAllowanceResponseDTO> {
  // 1. Check authorization - only HR can update vacation allowances
  if (currentUserRole !== "HR") {
    throw new Error("Only HR users can update vacation allowances");
  }

  // 2. Verify allowance exists
  const { data: existingAllowance, error: checkError } = await supabase
    .from("vacation_allowances")
    .select("id, user_id, year")
    .eq("id", allowanceId)
    .single();

  if (checkError || !existingAllowance) {
    throw new Error("Vacation allowance not found");
  }

  // 3. Build update object (only include provided fields)
  const updateData: {
    total_days?: number;
    carryover_days?: number;
  } = {};

  if (data.totalDays !== undefined) {
    updateData.total_days = data.totalDays;
  }

  if (data.carryoverDays !== undefined) {
    updateData.carryover_days = data.carryoverDays;
  }

  // 4. Update vacation allowance
  const { data: updatedAllowance, error: updateError } = await supabase
    .from("vacation_allowances")
    .update(updateData)
    .eq("id", allowanceId)
    .select("id, user_id, year, total_days, carryover_days, updated_at")
    .single();

  if (updateError || !updatedAllowance) {
    throw new Error("Failed to update vacation allowance");
  }

  // 5. Return response DTO
  return {
    id: updatedAllowance.id,
    userId: updatedAllowance.user_id,
    year: updatedAllowance.year,
    totalDays: updatedAllowance.total_days,
    carryoverDays: updatedAllowance.carryover_days,
    updatedAt: updatedAllowance.updated_at,
  };
}
