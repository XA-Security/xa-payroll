"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import {
  DollarSign,
  Users,
  Package,
  Flag,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePermissions } from "@/hooks/use-permissions"

// XA Security company data
const companyData = {
  name: "XA Payroll Portal",
  logo: "/Logos/Stacked Wordmark/PNG/72 ppi/XA_Stacked Logo-Black.png",
  tagline: "Payroll Management",
}

// Version badge configuration
const versionConfig = {
  v1: {
    bg: "bg-gray-200",
    text: "text-gray-500",
  },
  v2: {
    bg: "bg-blue-200",
    text: "text-blue-500",
  },
} as const

// Navigation structure - Payroll only
const navMainData = [
  {
    title: "Payroll",
    url: "/dashboard/payroll",
    icon: DollarSign,
    items: [
      { title: "Employee Lists", url: "/dashboard/payroll/employees" },
      { title: "Payroll Projects", url: "/dashboard/payroll/projects" },
      { title: "Payroll Tracker", url: "/dashboard/payroll/payroll-tracker" },
    ],
  },
]

export function AppSidebar({
  user,
  userId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  userId?: string
}) {
  // Default user data if not provided
  const userData = {
    name: user?.name || "User",
    email: user?.email || "user@xasecurity.ca",
    avatar: user?.avatar,
  }

  const [navData, setNavData] = useState<(typeof navMainData) | null>(null)
  const { isAdmin, isLoading: permissionsLoading, can } = usePermissions(userId)

  useEffect(() => {
    // Don't compute nav data until permissions have loaded
    if (permissionsLoading) {
      return
    }

    const computeNavData = () => {
      // Compute filtered nav data
      let filteredData = navMainData.map((section) => {
        // Filter items by admin status
        if (section.items) {
          return {
            ...section,
            items: section.items.filter((item) => {
              // Hide items that require admin if user is not admin
              if ((item as any).requiresAdmin && !isAdmin()) {
                return false
              }
              return true
            }),
          } as typeof section
        }
        return section
      })

      // Filter top-level items that require specific permissions or admin access
      if (userId) {
        filteredData = filteredData.filter((item) => {
          // Check if section requires admin access
          if ((item as any).requiresAdmin && !isAdmin()) {
            return false
          }

          // Check if item requires a specific permission
          const requiresPermission = (item as any).requiresPermission
          if (requiresPermission) {
            return can(requiresPermission, 'read')
          }
          return true
        }) as typeof navMainData
      }

      setNavData(filteredData as typeof navMainData)
    }

    computeNavData()
  }, [isAdmin, permissionsLoading, userId, can])

  return (
    <Sidebar collapsible="icon" {...props} className="print:hidden">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-black text-white hover:bg-black/90 transition-colors overflow-hidden" title="XA Payroll Portal">
            <Image src="/Logos/Main Logo/PNG/72 ppi/XA_Logo-White.png" alt="XA Logo" width={36} height={36} className="size-full object-cover" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">{companyData.name}</span>
            <span className="truncate text-xs">{companyData.tagline}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navData && <NavMain items={navData} versionConfig={versionConfig} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
