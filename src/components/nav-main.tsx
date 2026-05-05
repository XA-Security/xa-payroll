"use client"

import { useEffect, useState } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// DropdownMenuItem is reserved for menu actions
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// Helper to check if a badge is numeric (for count badges)
const isNumericBadge = (badge?: string): boolean => {
  if (!badge) return false
  return /^\d+$/.test(badge)
}

// Helper to check if a badge is a "disabled" badge (like "Soon")
const isDisabledBadge = (badge?: string): boolean => {
  if (!badge) return false
  return !isNumericBadge(badge)
}

// Helper to get version badge colors
const getVersionBadgeClasses = (version?: string, config?: Record<string, { bg: string; text: string }>) => {
  if (!version || !config?.[version]) return null
  return config[version]
}

// Helper to get/set section open state in localStorage
const getOpenSections = (): Set<string> => {
  if (typeof window === "undefined") return new Set()
  try {
    const stored = localStorage.getItem("nav_open_sections")
    return new Set(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

const saveOpenSections = (openSections: Set<string>) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("nav_open_sections", JSON.stringify(Array.from(openSections)))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function NavMain({
  items,
  versionConfig,
}: {
  items: {
    title: string
    url?: string
    icon?: LucideIcon
    isActive?: boolean
    badge?: string
    isExternal?: boolean
    items?: {
      title: string
      url?: string
      icon?: LucideIcon
      isActive?: boolean
      badge?: string
      disabled?: boolean
      version?: string
      items?: {
        title: string
        url: string
        badge?: string
        disabled?: boolean
      }[]
    }[]
  }[]
  versionConfig?: Record<string, { bg: string; text: string }>
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Initialize with pre-loaded sections from data attribute (set by inline script)
  // This prevents a flash of incorrectly expanded/collapsed sections on page load
  const getInitialOpenSections = (): Set<string> => {
    if (typeof window === "undefined") return new Set()
    try {
      // First, try to get pre-loaded sections from data attribute
      const preLoaded = document.documentElement.getAttribute('data-nav-sections')
      if (preLoaded) {
        return new Set(JSON.parse(preLoaded))
      }
    } catch {
      // Fall back to localStorage
    }
    return getOpenSections()
  }

  const [openSections, setOpenSections] = useState<Set<string>>(getInitialOpenSections)

  // Load saved open sections on mount (updates with latest from localStorage)
  useEffect(() => {
    setOpenSections(getOpenSections())
  }, [])

  // Handle section toggle
  const toggleSection = (title: string, isOpen: boolean) => {
    const newOpen = new Set(openSections)
    if (isOpen) {
      newOpen.add(title)
    } else {
      newOpen.delete(title)
    }
    setOpenSections(newOpen)
    saveOpenSections(newOpen)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
            // Items without sub-items should be simple links
            const hasDisabledBadge = isDisabledBadge(item.badge)
            if (!item.items || hasDisabledBadge) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    disabled={hasDisabledBadge}
                    className={hasDisabledBadge ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    asChild={!hasDisabledBadge}
                  >
                    {hasDisabledBadge ? (
                      <>
                        {item.icon && <item.icon className="size-4" />}
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </span>
                      </>
                    ) : item.isExternal ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="size-4" />}
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </div>
                        {isNumericBadge(item.badge) && (
                          <span className="ml-auto text-xs font-semibold text-white bg-red-500 rounded-full size-5 flex items-center justify-center group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
                      </a>
                    ) : (
                      <a href={item.url} className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="size-4" />}
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </div>
                        {isNumericBadge(item.badge) && (
                          <span className="ml-auto text-xs font-semibold text-white bg-red-500 rounded-full size-5 flex items-center justify-center group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            // Items with sub-items
            if (isCollapsed) {
              // Use dropdown menu when collapsed
              return (
                <SidebarMenuItem key={item.title}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        tooltip={`${item.title}${item.items?.length ? ` (${item.items.length} items)` : ''}`}
                        className="cursor-pointer"
                      >
                        {item.icon && <item.icon className="size-4" />}
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="min-w-56">
                      {item.items?.map((subItem) => (
                        <a
                          key={subItem.title}
                          href={subItem.url || '#'}
                          className="hover:bg-gray-100 dark:hover:bg-gray-800 relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none"
                        >
                          {subItem.icon && <subItem.icon className="size-4 mr-2" />}
                          <span>{subItem.title}</span>
                        </a>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              )
            }

            // Use collapsible when expanded
            return (
              <Collapsible
                key={item.title}
                asChild
                open={openSections.has(item.title)}
                onOpenChange={(isOpen) => toggleSection(item.title, isOpen)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={`${item.title}${item.items?.length ? ` (${item.items.length} items)` : ''}`} className="cursor-pointer">
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        // Handle sub-items with nested items
                        if (subItem.items) {
                          return (
                            <Collapsible
                              key={subItem.title}
                              defaultOpen={subItem.isActive}
                              className="group/sub-collapsible"
                            >
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuSubButton className="cursor-pointer">
                                    {subItem.icon && <subItem.icon className="size-4" />}
                                    <span className="group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                                    <ChevronRight className="ml-auto size-3 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                                  </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {subItem.items.map((nestedItem) => (
                                      <SidebarMenuSubItem key={nestedItem.title}>
                                        <SidebarMenuSubButton asChild>
                                          <a href={nestedItem.url}>
                                            <span>{nestedItem.title}</span>
                                          </a>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuSubItem>
                            </Collapsible>
                          )
                        }

                        // Handle regular sub-items
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild={!subItem.disabled && !!subItem.url}
                              className={subItem.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            >
                              {subItem.disabled ? (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    {subItem.icon && <subItem.icon className="size-4" />}
                                    <span className="group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                                  </div>
                                  <div className="ml-auto flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                                    {subItem.version && subItem.version !== "v1" && getVersionBadgeClasses(subItem.version, versionConfig) && (
                                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getVersionBadgeClasses(subItem.version, versionConfig).bg} ${getVersionBadgeClasses(subItem.version, versionConfig).text}`}>
                                        {subItem.version}
                                      </span>
                                    )}
                                    {subItem.badge && (
                                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : subItem.url ? (
                                <a href={subItem.url} className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    {subItem.icon && <subItem.icon className="size-4" />}
                                    <span className="group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                                  </div>
                                  <div className="ml-auto flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                                    {subItem.version && subItem.version !== "v1" && getVersionBadgeClasses(subItem.version, versionConfig) && (
                                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getVersionBadgeClasses(subItem.version, versionConfig).bg} ${getVersionBadgeClasses(subItem.version, versionConfig).text}`}>
                                        {subItem.version}
                                      </span>
                                    )}
                                    {isNumericBadge(subItem.badge) && (
                                      <span className="text-xs font-semibold text-white bg-red-500 rounded-full size-5 flex items-center justify-center">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </div>
                                </a>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    {subItem.icon && <subItem.icon className="size-4" />}
                                    <span className="group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                                  </div>
                                  <div className="ml-auto flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                                    {subItem.version && subItem.version !== "v1" && getVersionBadgeClasses(subItem.version, versionConfig) && (
                                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getVersionBadgeClasses(subItem.version, versionConfig).bg} ${getVersionBadgeClasses(subItem.version, versionConfig).text}`}>
                                        {subItem.version}
                                      </span>
                                    )}
                                    {subItem.badge && (
                                      <span className={isNumericBadge(subItem.badge) ? "text-xs font-semibold text-white bg-red-500 rounded-full size-5 flex items-center justify-center" : "text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"}>
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
  )
}
