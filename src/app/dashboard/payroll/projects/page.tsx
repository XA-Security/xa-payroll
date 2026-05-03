"use client"

import { useEffect } from "react"
import { useBreadcrumbs } from "@/components/breadcrumb-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PayrollProjectsPage() {
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([
      { label: "Payroll", href: "/dashboard/payroll" },
      { label: "Payroll Projects" },
    ])
  }, [setBreadcrumbs])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Payroll Projects</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-muted-foreground">Manage and run payroll for different client projects</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Under Development</CardTitle>
          <CardDescription>
            Payroll Projects will allow you to organize, manage, and run payroll for different client projects.
            This feature is currently being developed and will be available soon.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
