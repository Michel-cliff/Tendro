import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE);
