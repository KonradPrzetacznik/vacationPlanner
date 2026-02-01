/**
 * Supabase Client Mock Factory
 * Provides utilities for creating mock Supabase clients for unit tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Creates a mock Supabase query builder
 */
const createMockQueryBuilder = () => {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
  };
};

/**
 * Creates a successful query response builder
 */
const createSuccessResponse = (data: any, count: number | null = null) => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: "OK",
});

/**
 * Creates an error response builder
 */
const createErrorResponse = (message: string, code: string = "UNKNOWN") => ({
  data: null,
  error: {
    message,
    code,
    details: "",
    hint: "",
  },
  count: null,
  status: 400,
  statusText: "Bad Request",
});

/**
 * Creates a mock Supabase client
 * Usage: vi.mocked(mockSupabase.from).mockReturnValue(...)
 */
export const createMockSupabaseClient = (): SupabaseClient => {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;
};

/**
 * Helper to setup a successful select query chain
 * @example
 * setupSelectQuery(mockSupabase, 'users', [{ id: '1', name: 'John' }])
 * // Then: mockSupabase.from('users').select().eq(...).single()
 */
export const setupSelectQuery = (
  mockSupabase: SupabaseClient,
  tableName: string,
  data: any,
  options?: { count?: number }
) => {
  const builder = createMockQueryBuilder();
  const response = createSuccessResponse(data, options?.count ?? null);

  // Chain all possible methods to return resolved promise
  Object.keys(builder).forEach((key) => {
    vi.mocked(builder[key as keyof typeof builder]).mockReturnValue(Promise.resolve(response) as any);
  });

  vi.mocked(mockSupabase.from).mockReturnValue(builder as any);
  return builder;
};

/**
 * Helper to setup RPC call
 * @example
 * setupRpcCall(mockSupabase, 'get_users_with_emails', mockUsers)
 */
export const setupRpcCall = (mockSupabase: SupabaseClient, functionName: string, data: any) => {
  const response = createSuccessResponse(data);
  vi.mocked(mockSupabase.rpc).mockResolvedValue(response as any);
};

/**
 * Helper to setup failed query
 */
export const setupFailedQuery = (mockSupabase: SupabaseClient, tableName: string, errorMessage: string) => {
  const builder = createMockQueryBuilder();
  const response = createErrorResponse(errorMessage);

  Object.keys(builder).forEach((key) => {
    vi.mocked(builder[key as keyof typeof builder]).mockReturnValue(Promise.resolve(response) as any);
  });

  vi.mocked(mockSupabase.from).mockReturnValue(builder as any);
  return builder;
};

export { createMockQueryBuilder, createSuccessResponse, createErrorResponse };
