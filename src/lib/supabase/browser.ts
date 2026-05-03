'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Lazy-initialized singleton Supabase browser client
 * Prevents multiple GoTrueClient instances from being created
 * @see https://github.com/supabase/supabase-js/issues/1015
 */
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Format Supabase URL properly
  const formattedUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}.supabase.co`

  // Create and cache the client instance
  clientInstance = createBrowserClient(formattedUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      // CRITICAL: Disable autoRefreshToken to prevent concurrent refresh race conditions
      // When multiple requests fire simultaneously (e.g., on dashboard load), they can all
      // trigger token refresh at the same time, causing Supabase to reject with 409 conflict.
      // With SSR, the server client handles session refresh via cookies. The browser client
      // should use cookies without attempting its own refresh logic.
      // @see https://github.com/supabase/supabase-js/issues/1015
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Type': 'browser',
      },
    },
  })

  return clientInstance
}

/**
 * @deprecated Use getSupabaseBrowserClient() instead
 * Kept for backward compatibility during migration
 */
export function createClient() {
  return getSupabaseBrowserClient()
}
