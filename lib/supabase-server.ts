// Per-request Supabase client for Membercheck API routes.
// Admin operations carry the logged-in member's JWT so is_member() returns true.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export function getUserSupabase(authHeader: string | null | undefined): SupabaseClient {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}
