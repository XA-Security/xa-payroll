/**
 * Hook for checking permissions in React components
 * Provides permission checking and conditional rendering capabilities
 */

import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/lib/supabase/hooks'
import {
  checkPermission,
  getUserPermissions,
  clearPermissionCache,
  type PermissionLevel,
  type UserPermissions
} from '@/lib/permissions'

export function usePermissions(userId: string | null | undefined) {
  const supabase = useSupabase()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const loadPermissions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const userPerms = await getUserPermissions(supabase, userId)
        setPermissions(userPerms)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load permissions')
        setPermissions(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadPermissions()
  }, [userId, supabase])

  const hasPermission = useCallback(
    async (section: string, level: PermissionLevel = 'read'): Promise<boolean> => {
      if (!userId) return false
      return checkPermission(supabase, userId, section, level)
    },
    [userId, supabase]
  )

  const can = useCallback(
    (section: string, level: PermissionLevel = 'read'): boolean => {
      if (!permissions) return false
      const userLevel = permissions.sectionPermissions[section] || 'none'
      const levelMap = { none: 0, read: 1, write: 2 }
      const requiredLevelInt = levelMap[level]
      const userLevelInt = levelMap[userLevel as PermissionLevel]
      return userLevelInt >= requiredLevelInt
    },
    [permissions]
  )

  const canRead = useCallback(
    (section: string): boolean => can(section, 'read'),
    [can]
  )

  const canWrite = useCallback(
    (section: string): boolean => can(section, 'write'),
    [can]
  )

  const isInGroup = useCallback(
    (groupName: string): boolean => {
      if (!permissions) return false
      return permissions.groups.includes(groupName)
    },
    [permissions]
  )

  const isAdmin = useCallback(
    (): boolean => isInGroup('Admin'),
    [isInGroup]
  )

  const refresh = useCallback(async () => {
    if (!userId) return
    try {
      clearPermissionCache(userId)
      const userPerms = await getUserPermissions(supabase, userId, true)
      setPermissions(userPerms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh permissions')
    }
  }, [userId, supabase])

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    can,
    canRead,
    canWrite,
    isInGroup,
    isAdmin,
    refresh,
  }
}

/**
 * Higher-order component to protect pages/components with permission checks
 */
export function withPermissionGuard(
  Component: React.ComponentType<Record<string, unknown>>,
  requiredSection: string,
  requiredLevel: PermissionLevel = 'read',
  fallbackComponent?: React.ComponentType<Record<string, unknown>>
) {
  return function ProtectedComponent(props: Record<string, unknown>) {
    const { user } = props
    const userId = typeof user === 'object' && user !== null && 'id' in user ? (user.id as string) : undefined
    const { permissions, isLoading } = usePermissions(userId)

    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    const userLevel = permissions?.sectionPermissions[requiredSection] || 'none'
    const levelMap = { none: 0, read: 1, write: 2 }
    const requiredLevelInt = levelMap[requiredLevel]
    const userLevelInt = levelMap[userLevel as PermissionLevel]

    if (userLevelInt < requiredLevelInt) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent
        return <FallbackComponent />
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You do not have permission to access this section.
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
