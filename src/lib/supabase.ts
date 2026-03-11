import { createClient } from '@supabase/supabase-js'

// Browser-safe client using public anon key — lazy so build doesn't crash
// when NEXT_PUBLIC vars are absent at build time.
export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
