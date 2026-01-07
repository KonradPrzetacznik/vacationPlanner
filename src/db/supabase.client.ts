import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Regular client for standard operations (uses anon key with RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for privileged operations (uses service_role key, bypasses RLS)
// Only use this for operations that require admin privileges (e.g., creating users)
export const supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

export type SupabaseClient = typeof supabaseClient;
