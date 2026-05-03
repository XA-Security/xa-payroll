import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'
import { format, parse, add } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function addDays(dateStr: string, days: number): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date())
  const result = add(date, { days })
  return format(result, 'yyyy-MM-dd')
}

function generatePayrollLabel(startDate: string, endDate: string): string {
  const startLabel = format(parse(startDate, 'yyyy-MM-dd', new Date()), 'MMM d')
  const endLabel = format(parse(endDate, 'yyyy-MM-dd', new Date()), 'MMM d')
  const payDate = addDays(endDate, 10)
  const payLabel = format(parse(payDate, 'yyyy-MM-dd', new Date()), 'MMM d')
  return `${startLabel} – ${endLabel}  ·  Pay ${payLabel}`
}

async function handleRecurringRollover(issues: any[]) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const recurringOutstanding = issues.filter(i => i.is_recurring && i.status === 'outstanding')

  for (const issue of recurringOutstanding) {
    // Get the source ID (root of recurring chain)
    const sourceId = issue.recurring_source_id ?? issue.id

    // Find all issues in this recurring chain
    const chainIssues = issues.filter(
      i => (i.recurring_source_id === sourceId || i.id === sourceId) && i.status === 'outstanding'
    )

    if (chainIssues.length === 0) continue

    // Get the latest period in the chain
    const latestIssue = chainIssues.sort((a, b) =>
      b.pay_period_start.localeCompare(a.pay_period_start)
    )[0]

    // If the latest period has already ended, create the next period
    if (latestIssue.pay_period_end < today) {
      const nextStart = addDays(latestIssue.pay_period_start, 14)
      const nextEnd = addDays(latestIssue.pay_period_end, 14)

      // Check if entry already exists for next period
      const alreadyExists = issues.some(
        i =>
          (i.recurring_source_id === sourceId || i.id === sourceId) &&
          i.pay_period_start === nextStart
      )

      if (!alreadyExists) {
        await supabase.from('payroll_tracker_issues').insert({
          employee_name: latestIssue.employee_name,
          salary: latestIssue.salary,
          type: latestIssue.type,
          amount: latestIssue.amount,
          direction: latestIssue.direction,
          pay_period_start: nextStart,
          pay_period_end: nextEnd,
          pay_period_label: generatePayrollLabel(nextStart, nextEnd),
          notes: latestIssue.notes,
          status: 'outstanding',
          created_by_email: latestIssue.created_by_email,
          created_by_name: latestIssue.created_by_name,
          created_by_avatar_url: latestIssue.created_by_avatar_url,
          is_recurring: true,
          recurring_source_id: sourceId,
        })
      }
    }
  }
}

export const GET = withAuth(async () => {
  try {
    const { data, error } = await supabase
      .from('payroll_tracker_issues')
      .select('*, payroll_tracker_issue_attachments(*)')
      .eq('period_archived', false)
      .order('pay_period_start', { ascending: false })

    if (error) throw error

    const issues = data ?? []

    // Handle recurring rollover
    if (issues.length > 0) {
      await handleRecurringRollover(issues)
    }

    // Re-fetch after potential rollover
    const { data: finalData, error: finalError } = await supabase
      .from('payroll_tracker_issues')
      .select('*, payroll_tracker_issue_attachments(*)')
      .eq('period_archived', false)
      .order('pay_period_start', { ascending: false })

    if (finalError) throw finalError

    const mappedIssues = (finalData ?? []).map(issue => ({
      ...issue,
      attachments: issue.payroll_tracker_issue_attachments ?? [],
    }))

    return NextResponse.json({ success: true, issues: mappedIssues })
  } catch (error) {
    console.error('Error fetching payroll tracker issues:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()

    const {
      employee_name,
      salary,
      type,
      amount,
      direction,
      pay_period_start,
      pay_period_end,
      pay_period_label,
      notes,
      is_recurring,
    } = body

    if (!employee_name || !type || !amount || !pay_period_start || !pay_period_end || !notes) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validTypes = ['garnishment', 'deduction', 'expense', 'payroll_correction', 'bonus', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid issue type' },
        { status: 400 }
      )
    }

    const defaultDirectionByType: Record<string, 'owe_employee' | 'employee_owes'> = {
      garnishment: 'employee_owes',
      deduction: 'employee_owes',
      expense: 'owe_employee',
      payroll_correction: 'owe_employee',
      bonus: 'owe_employee',
      other: 'owe_employee',
    }
    const resolvedDirection = direction ?? defaultDirectionByType[type]

    const validDirections = ['owe_employee', 'employee_owes']
    if (!validDirections.includes(resolvedDirection)) {
      return NextResponse.json(
        { success: false, error: 'Invalid direction' },
        { status: 400 }
      )
    }

    const createdByName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || user.nickname || user.email || 'Unknown'

    const { data, error } = await supabase
      .from('payroll_tracker_issues')
      .insert({
        employee_name: employee_name.trim(),
        salary: salary ? parseFloat(salary) : null,
        type,
        amount: parseFloat(amount),
        direction: resolvedDirection,
        pay_period_start,
        pay_period_end,
        pay_period_label,
        notes: notes.trim(),
        status: 'outstanding',
        created_by_email: user.email,
        created_by_name: createdByName,
        created_by_avatar_url: user.avatar_url ?? null,
        is_recurring: is_recurring === true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, issue: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll tracker issue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    )
  }
})
