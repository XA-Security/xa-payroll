'use client'

import { useMemo } from 'react'
import { getSupabaseBrowserClient } from './browser'

/**
 * Hook to access the Supabase browser client in Client Components
 * Returns the same singleton instance on every call (memoized)
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client'
 * import { useSupabase } from '@/lib/supabase/hooks'
 *
 * export function MyComponent() {
 *   const supabase = useSupabase()
 *   // Use supabase client...
 * }
 * ```
 */
export function useSupabase() {
  return useMemo(() => getSupabaseBrowserClient(), [])
}
