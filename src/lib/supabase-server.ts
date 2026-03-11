import "server-only"
import { createClient } from '@supabase/supabase-js'

// Server-only client using service role key — bypasses RLS for server actions.
// Never import this in client components.
export function getSupabaseServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
