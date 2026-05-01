import { supabase } from "./supabase";

// Auto-signs in as the demo account when no session exists.
// Called at the top of any data-loading function that previously
// required the user to be authenticated.
export async function ensureDemoSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "trendofintech@gmail.com",
    password: "Fintech123",
  });

  return error ? null : (data.user ?? null);
}
