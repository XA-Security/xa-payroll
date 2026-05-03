/**
 * Server-side only: Supabase admin client with service role key
 * Use this ONLY for server components and API routes that need elevated privileges
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Lazy-initialized singleton to prevent multiple instances
let adminClientInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  // Return existing instance if available
  if (adminClientInstance) {
    return adminClientInstance
  }

  // Validate environment variables at function call time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  }

  // Format Supabase URL properly
  const formattedUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}.supabase.co`

  // Create and cache the admin client instance
  adminClientInstance = createClient<Database>(formattedUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return adminClientInstance
}

/**
 * @deprecated Use getSupabaseAdmin() instead
 * Kept for backward compatibility
 */
export { getSupabaseAdmin as supabaseAdmin }
