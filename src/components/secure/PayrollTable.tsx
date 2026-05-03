'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { format, parse } from 'date-fns'

interface PayrollEntry {
  date: {
    formatted: string
    timestamp: number
  }
  start_time: string
  end_time: string
  hours: {
    regular: number
    special: number
    overtime: number
    total: number
    cost: number
    rate: number | null
    position: { name: string }
    location: { name: string }
  }
  in_location_name: string
  out_location_name: string
}

interface PayrollTableProps {
  isLoading?: boolean
  entries?: PayrollEntry[]
  error?: string | null
}

export function PayrollTable({ isLoading, entries, error }: PayrollTableProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">No payroll entries found for this period</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate totals
  const totals = entries.reduce(
    (acc, entry) => ({
      regular: acc.regular + entry.hours.regular,
      special: acc.special + entry.hours.special,
      overtime: acc.overtime + entry.hours.overtime,
      total: acc.total + entry.hours.total,
      cost: acc.cost + entry.hours.cost,
    }),
    { regular: 0, special: 0, overtime: 0, total: 0, cost: 0 }
  )

  // Sort by date
  const sortedEntries = [...entries].sort((a, b) => a.date.timestamp - b.date.timestamp)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Regular Hrs</TableHead>
                <TableHead className="text-right">OT Hrs</TableHead>
                <TableHead className="text-right">STAT Hrs</TableHead>
                <TableHead className="text-right">Total Hrs</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry, idx) => (
                <TableRow key={`${entry.date.timestamp}-${idx}`}>
                  <TableCell className="font-medium">
                    {format(new Date(entry.date.timestamp * 1000), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.start_time} - {entry.end_time}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.hours.location?.name || entry.in_location_name || '-'}
                  </TableCell>
                  <TableCell className="text-right">{entry.hours.regular.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{entry.hours.overtime.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{entry.hours.special.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">{entry.hours.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {entry.hours.rate ? `$${entry.hours.rate.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${entry.hours.cost.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Summary row */}
              <TableRow className="bg-slate-50 font-semibold">
                <TableCell colSpan={3}>TOTAL</TableCell>
                <TableCell className="text-right">{totals.regular.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.overtime.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.special.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.total.toFixed(2)}</TableCell>
                <TableCell />
                <TableCell className="text-right">${totals.cost.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
