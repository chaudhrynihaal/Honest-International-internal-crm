import { createClient } from "@supabase/supabase-js";

// Server-only privileged client (service role key bypasses RLS). All access is
// still gated by our own getUser() checks in each API route / server component —
// never import this into client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
