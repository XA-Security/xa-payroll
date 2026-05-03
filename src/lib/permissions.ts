/**
 * Permission system utilities
 * Handles permission checking, caching, and enforcement
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type PermissionLevel = 'none' | 'read' | 'write'
export type PermissionLevelInt = 0 | 1 | 2

export const PERMISSION_LEVELS = {
  none: 0,
  read: 1,
  write: 2,
} as const

export const PERMISSION_LEVEL_NAMES: Record<PermissionLevelInt, PermissionLevel> = {
  0: 'none',
  1: 'read',
  2: 'write',
}

export const PERMISSION_DESCRIPTIONS: Record<PermissionLevel, string> = {
  none: 'No access',
  read: 'View only access',
  write: 'Full read and write access',
}

// Cache for user permissions with 5-minute TTL
const permissionCache = new Map<string, {
  data: UserPermissions
  timestamp: number
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export interface UserPermissions {
  userId: string
  globalRole: string
  groups: string[]
  sectionPermissions: Record<string, PermissionLevel>
}

export interface PermissionSection {
  id: string
  name: string
  displayName: string
  description: string
  sortOrder: number
}

export interface PermissionGroup {
  id: string
  name: string
  description: string
  isDefault: boolean
  sectionPermissions: Record<string, PermissionLevel>
}

/**
 * Get user permissions with caching
 */
export async function getUserPermissions(
  supabase: SupabaseClient,
  userId: string,
  forceRefresh = false
): Promise<UserPermissions> {
  // Check cache first
  if (!forceRefresh) {
    const cached = permissionCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }

  try {
    // Fetch user's groups
    const { data: groupMemberships, error: groupError } = await supabase
      .from('user_group_memberships')
      .select(`
        group_id,
        permission_groups!inner(name)
      `)
      .eq('user_id', userId)

    if (groupError) {
      console.error('Failed to fetch user groups:', groupError)
      return createDefaultPermissions(userId)
    }

    const groups: string[] = (groupMemberships?.map(
      (m: Record<string, unknown>) => (m.permission_groups as Record<string, unknown> | undefined)?.name
    ).filter(Boolean) || []) as string[]

    // Fetch user's direct section permissions (overrides)
    const { data: directPermissions, error: directError } = await supabase
      .from('user_section_permissions')
      .select(`
        permission_sections!inner(name),
        permission_level
      `)
      .eq('user_id', userId)

    if (directError) {
      console.error('Failed to fetch user permissions:', directError)
    }

    const directPerms = directPermissions || []
    const directPermMap: Record<string, PermissionLevelInt> = {}

    directPerms.forEach((perm: Record<string, unknown>) => {
      const sections = perm.permission_sections as Record<string, unknown> | undefined
      if (sections?.name) {
        directPermMap[sections.name as string] = perm.permission_level as PermissionLevelInt
      }
    })

    // Fetch all sections
    const { data: sections, error: sectionsError } = await supabase
      .from('permission_sections')
      .select('*')
      .order('sort_order', { ascending: true })

    if (sectionsError) {
      console.error('Failed to fetch sections:', sectionsError)
    }

    const sectionList = sections || []

    // Build permission map for each section
    const sectionPermissions: Record<string, PermissionLevel> = {}

    // Batch-fetch all group section permissions in a single query (fixes N+1)
    const groupPermBySectionId: Record<string, PermissionLevelInt> = {}
    if (groups.length > 0) {
      const groupIds = groupMemberships
        ?.map((m: Record<string, unknown>) => m.group_id)
        .filter(Boolean) || []

      const { data: allGroupPerms, error: allGroupPermsError } = await supabase
        .from('group_section_permissions')
        .select('section_id, permission_level')
        .in('group_id', groupIds)

      if (!allGroupPermsError && allGroupPerms) {
        allGroupPerms.forEach((perm: Record<string, unknown>) => {
          const sectionId = perm.section_id as string
          const permLevel = perm.permission_level as PermissionLevelInt
          const current = groupPermBySectionId[sectionId] || 0
          if (permLevel > current) {
            groupPermBySectionId[sectionId] = permLevel
          }
        })
      }
    }

    for (const section of sectionList) {
      // Check if user has direct permission override
      if (directPermMap[section.name]) {
        sectionPermissions[section.name] = PERMISSION_LEVEL_NAMES[directPermMap[section.name]]
        continue
      }

      // Use pre-fetched group permission map (highest level from any group)
      const maxLevel = (groupPermBySectionId[section.id] ?? 0) as PermissionLevelInt
      sectionPermissions[section.name] = PERMISSION_LEVEL_NAMES[maxLevel]
    }

    const userPermissions: UserPermissions = {
      userId,
      globalRole: 'user', // This would come from the users table role field
      groups,
      sectionPermissions,
    }

    // Cache the result
    permissionCache.set(userId, {
      data: userPermissions,
      timestamp: Date.now(),
    })

    return userPermissions
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return createDefaultPermissions(userId)
  }
}

/**
 * Create default (no access) permissions
 */
function createDefaultPermissions(userId: string): UserPermissions {
  return {
    userId,
    globalRole: 'user',
    groups: [],
    sectionPermissions: {},
  }
}

/**
 * Check if user has required permission level for a section
 */
export async function checkPermission(
  supabase: SupabaseClient,
  userId: string,
  section: string,
  requiredLevel: PermissionLevel
): Promise<boolean> {
  const permissions = await getUserPermissions(supabase, userId)
  const userLevel = permissions.sectionPermissions[section] || 'none'

  const requiredLevelInt = PERMISSION_LEVELS[requiredLevel]
  const userLevelInt = PERMISSION_LEVELS[userLevel]

  const result = userLevelInt >= requiredLevelInt

  return result
}

/**
 * Clear permission cache for a user
 */
export function clearPermissionCache(userId: string): void {
  permissionCache.delete(userId)
}

/**
 * Clear all permission caches
 */
export function clearAllPermissionCaches(): void {
  permissionCache.clear()
}

/**
 * Get all permission sections with their details
 */
export async function getAllPermissionSections(
  supabase: SupabaseClient
): Promise<PermissionSection[]> {
  const { data, error } = await supabase
    .from('permission_sections')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch permission sections:', error)
    return []
  }

  return (data || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    displayName: s.display_name as string,
    description: s.description as string,
    sortOrder: s.sort_order as number,
  }))
}

/**
 * Get all permission groups with their section permissions
 */
export async function getAllPermissionGroups(
  supabase: SupabaseClient
): Promise<PermissionGroup[]> {
  const { data: groups, error: groupsError } = await supabase
    .from('permission_groups')
    .select('*')
    .order('name', { ascending: true })

  if (groupsError) {
    console.error('Failed to fetch permission groups:', groupsError)
    return []
  }

  // For each group, get its section permissions
  const groupsWithPerms = await Promise.all(
    (groups || []).map(async (group: Record<string, unknown>) => {
      const { data: perms } = await supabase
        .from('group_section_permissions')
        .select(`
          permission_sections!inner(name),
          permission_level
        `)
        .eq('group_id', group.id)

      const sectionPermissions: Record<string, PermissionLevel> = {}
      perms?.forEach((perm: Record<string, unknown>) => {
        const sections = perm.permission_sections as Record<string, unknown> | undefined
        if (sections?.name) {
          sectionPermissions[sections.name as string] = PERMISSION_LEVEL_NAMES[perm.permission_level as PermissionLevelInt]
        }
      })

      return {
        id: group.id as string,
        name: group.name as string,
        description: group.description as string,
        isDefault: group.is_default as boolean,
        sectionPermissions,
      }
    })
  )

  return groupsWithPerms
}

/**
 * Verify user has admin role for permission management
 * Note: This is a security check - always verify on the server side too
 */
export async function isPermissionAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const permissions = await getUserPermissions(supabase, userId)

  // User must be in Admin group and have write access to Settings section
  return (
    permissions.groups.includes('Admin') &&
    permissions.sectionPermissions.settings === 'write'
  )
}
