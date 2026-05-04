"use client"

import { useEffect, useState } from "react"
import { useBreadcrumbs } from "@/components/breadcrumb-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface HumanityEmployee {
  eid: string
  name: string
  job_title?: string
  status_in_humanity?: string
}

interface QBOEmployee {
  id: string
  firstName?: string
  lastName?: string
  primaryAddress?: {
    city?: string
    countrySubDivisionCode?: string
  }
  status?: string
}

export default function EmployeeListsPage() {
  const { setBreadcrumbs } = useBreadcrumbs()
  const [humanityEmployees, setHumanityEmployees] = useState<HumanityEmployee[]>([])
  const [qboEmployees, setQboEmployees] = useState<QBOEmployee[]>([])
  const [humanityLoading, setHumanityLoading] = useState(true)
  const [qboLoading, setQboLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBreadcrumbs([
      { label: "Payroll", href: "/dashboard/payroll" },
      { label: "Employee Lists" },
    ])
  }, [setBreadcrumbs])

  useEffect(() => {
    fetchHumanityEmployees()
    fetchQboEmployees()
  }, [])

  async function fetchHumanityEmployees() {
    try {
      const res = await fetch("/api/humanity/employees")
      if (!res.ok) throw new Error("Failed to fetch Humanity employees")
      const data = await res.json()
      setHumanityEmployees(data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setHumanityLoading(false)
    }
  }

  async function fetchQboEmployees() {
    try {
      const res = await fetch("/api/quickbooks/payroll/employees")
      if (!res.ok) throw new Error("Failed to fetch QBO employees")
      const data = await res.json()
      setQboEmployees(data.employees ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setQboLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Employee Lists</h1>
        <p className="text-muted-foreground">View employees from Humanity and QuickBooks</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="humanity" className="w-full">
        <TabsList>
          <TabsTrigger value="humanity">Humanity Employees</TabsTrigger>
          <TabsTrigger value="qbo">QBO Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="humanity" className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Humanity Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {humanityLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : humanityEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  humanityEmployees.map((emp) => (
                    <TableRow key={emp.eid}>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.job_title || "-"}</TableCell>
                      <TableCell>
                        {emp.status_in_humanity && (
                          <Badge variant="secondary">{emp.status_in_humanity}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="qbo" className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qboLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : qboEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  qboEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>{`${emp.firstName || ""} ${emp.lastName || ""}`}</TableCell>
                      <TableCell>{emp.primaryAddress?.city || "-"}</TableCell>
                      <TableCell>{emp.primaryAddress?.countrySubDivisionCode || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={emp.status === "ACTIVE" ? "default" : "secondary"}>
                          {emp.status || "Unknown"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
