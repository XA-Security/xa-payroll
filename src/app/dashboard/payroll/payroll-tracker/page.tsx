'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parse } from 'date-fns'
import { ChevronDown, ChevronUp, Plus, AlertCircle, Pencil, ArchiveX } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBreadcrumbs } from '@/components/breadcrumb-context'
import { usePayrollTrackerIssues, PayrollTrackerIssue } from '@/hooks/use-payroll-tracker'
import { authFetch } from '@/lib/api-client'
import { formatCurrency } from '@/lib/finance-utils'
import { generatePayrollCycles } from '@/lib/payroll-cycles'
import { useQueryClient } from '@tanstack/react-query'
import { PayrollIssueDialog } from './payroll-issue-dialog'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const TYPE_LABELS: Record<string, string> = {
  garnishment: 'Garnishment',
  deduction: 'Deduction',
  expense: 'Expense',
  payroll_correction: 'Payroll Correction',
  bonus: 'Bonus',
  other: 'Other',
}

interface GroupedIssues {
  label: string
  startDate: string
  endDate: string
  issues: PayrollTrackerIssue[]
  netAmount: number
}

export default function PayrollTrackerPage() {
  const { setBreadcrumbs } = useBreadcrumbs()
  const queryClient = useQueryClient()
  const { data: issues = [], isLoading } = usePayrollTrackerIssues()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<PayrollTrackerIssue | undefined>()
  const [closingPeriodStart, setClosingPeriodStart] = useState<string | null>(null)

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Finance', href: '/dashboard/finance/vendors' },
      { label: 'Payroll Tracker' },
    ])
  }, [setBreadcrumbs])

  const today = format(new Date(), 'yyyy-MM-dd')
  const cycles = useMemo(() => generatePayrollCycles(today), [today])

  // KPIs
  const outstandingCount = useMemo(
    () => issues.filter(i => i.status === 'outstanding').length,
    [issues]
  )

  const xaOwesTotal = useMemo(
    () =>
      issues
        .filter(i => i.status === 'outstanding' && i.direction === 'owe_employee')
        .reduce((sum, i) => sum + i.amount, 0),
    [issues]
  )

  const employeeOwesTotal = useMemo(
    () =>
      issues
        .filter(i => i.status === 'outstanding' && i.direction === 'employee_owes')
        .reduce((sum, i) => sum + i.amount, 0),
    [issues]
  )

  const netOwing = xaOwesTotal - employeeOwesTotal

  // Group issues by pay period
  const signedAmount = (issue: PayrollTrackerIssue) =>
    issue.direction === 'owe_employee' ? issue.amount : -issue.amount

  const grouped: GroupedIssues[] = useMemo(() => {
    const map = new Map<string, GroupedIssues>()

    for (const issue of issues) {
      const key = issue.pay_period_start
      const existing = map.get(key)

      if (existing) {
        existing.issues.push(issue)
        existing.netAmount += signedAmount(issue)
      } else {
        map.set(key, {
          label: issue.pay_period_label ?? issue.pay_period_start,
          startDate: issue.pay_period_start,
          endDate: issue.pay_period_end,
          issues: [issue],
          netAmount: signedAmount(issue),
        })
      }
    }

    return Array.from(map.values())
  }, [issues])

  const toggleExpand = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleResolve = async (id: string) => {
    try {
      const response = await authFetch(`/api/finance/payroll-tracker/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error || 'Failed to resolve issue')
        return
      }

      toast.success('Issue marked as resolved')
      queryClient.invalidateQueries({ queryKey: ['payroll-tracker-issues'] })
    } catch (error) {
      console.error('Error resolving issue:', error)
      toast.error('Failed to resolve issue')
    }
  }

  const handleClosePeriod = async () => {
    if (!closingPeriodStart) return

    try {
      const response = await authFetch('/api/finance/payroll-tracker/close-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_period_start: closingPeriodStart }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error || 'Failed to close period')
        return
      }

      toast.success('Period closed and archived')
      setClosingPeriodStart(null)
      queryClient.invalidateQueries({ queryKey: ['payroll-tracker-issues'] })
    } catch (error) {
      console.error('Error closing period:', error)
      toast.error('Failed to close period')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payroll Tracker</h1>
          <p className="mt-2 text-gray-600">Log and track payroll issues that need attention.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Log Issue
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Outstanding Issues
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{outstandingCount}</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            XA Owes Employees
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(xaOwesTotal)}</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Employees Owe XA
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(employeeOwesTotal)}</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Net Outstanding
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              netOwing > 0 ? 'text-amber-600' : netOwing < 0 ? 'text-green-600' : 'text-gray-900'
            }`}
          >
            {netOwing >= 0 ? '' : '−'}{formatCurrency(Math.abs(netOwing))}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {netOwing > 0 ? 'XA is net debtor' : netOwing < 0 ? 'Employees are net debtor' : 'Balanced'}
          </p>
        </Card>
      </div>

      {/* Issues by Pay Period */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">Loading issues...</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-12">
          <AlertCircle className="h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No payroll issues logged yet.</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Log First Issue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div
              key={group.startDate}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <Collapsible
                open={expandedGroups.has(group.startDate)}
                onOpenChange={() => toggleExpand(group.startDate)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex cursor-pointer items-center justify-between bg-gradient-to-r from-gray-50 to-white p-4 hover:from-gray-100 hover:to-gray-50">
                    <div className="flex items-center gap-3">
                      {expandedGroups.has(group.startDate) ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.label}</h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {group.issues.length} {group.issues.length === 1 ? 'issue' : 'issues'}
                          {' · '}
                          Net: {group.netAmount >= 0 ? '' : '−'}{formatCurrency(Math.abs(group.netAmount))}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={e => {
                        e.stopPropagation()
                        setClosingPeriodStart(group.startDate)
                      }}
                    >
                      <ArchiveX className="h-4 w-4" />
                      Close Period
                    </Button>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Approver</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Recurring</TableHead>
                          <TableHead>Attachments</TableHead>
                          <TableHead className="w-40" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.issues.map(issue => (
                          <TableRow key={issue.id}>
                            <TableCell className="font-medium">{issue.employee_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{TYPE_LABELS[issue.type]}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <span className={issue.direction === 'owe_employee' ? 'text-amber-600' : 'text-blue-600'}>
                                {issue.direction === 'employee_owes' ? '−' : '+'}{formatCurrency(issue.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 rounded-lg bg-gray-200">
                                  <AvatarImage src={issue.created_by_avatar_url || undefined} className="rounded-lg object-cover" />
                                  <AvatarFallback className="rounded-lg text-xs font-medium">
                                    {getInitials(issue.created_by_name ?? '')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-600">{issue.created_by_name ?? '—'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.status === 'outstanding' ? 'destructive' : 'secondary'
                                }
                              >
                                {issue.status === 'outstanding' ? 'Outstanding' : 'Resolved'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {issue.is_recurring ? (
                                <Badge variant="secondary">Yes</Badge>
                              ) : (
                                <span className="text-sm text-gray-500">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {issue.attachments && issue.attachments.length > 0 ? (
                                <Badge variant="outline">{issue.attachments.length} file(s)</Badge>
                              ) : (
                                <span className="text-sm text-gray-500">—</span>
                              )}
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingIssue(issue)
                                  setDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {issue.status === 'outstanding' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolve(issue.id)}
                                >
                                  Resolve
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!closingPeriodStart} onOpenChange={open => {
        if (!open) setClosingPeriodStart(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Period?</AlertDialogTitle>
            <AlertDialogDescription>
              This period will be archived and removed from the list. You can't undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClosePeriod} className="bg-red-600 hover:bg-red-700">
              Close Period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PayrollIssueDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) {
            setEditingIssue(undefined)
          }
        }}
        onSuccess={() => {
          // Dialog will refresh data via queryClient invalidation
        }}
        issue={editingIssue}
      />
    </div>
  )
}
