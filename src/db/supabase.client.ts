import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;
