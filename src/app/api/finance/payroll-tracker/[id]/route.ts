import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const PATCH = withAuth(async (request: NextRequest, user, context) => {
  try {
    const { id } = await context!.params
    const body = await request.json()

    // Support both status-only updates and full field updates
    const updateData: any = {}
    const validStatuses = ['outstanding', 'resolved']

    // If only status is provided, use it
    if (body.status) {
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = body.status
    }

    // Support full field updates for edit mode
    if (body.employee_name !== undefined) {
      updateData.employee_name = body.employee_name.trim()
    }
    if (body.salary !== undefined) {
      updateData.salary = body.salary ? parseFloat(body.salary) : null
    }
    if (body.type !== undefined) {
      const validTypes = ['garnishment', 'deduction', 'expense', 'payroll_correction', 'bonus', 'other']
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid issue type' },
          { status: 400 }
        )
      }
      updateData.type = body.type
    }
    if (body.amount !== undefined) {
      updateData.amount = parseFloat(body.amount)
    }
    if (body.pay_period_start !== undefined) {
      updateData.pay_period_start = body.pay_period_start
    }
    if (body.pay_period_end !== undefined) {
      updateData.pay_period_end = body.pay_period_end
    }
    if (body.pay_period_label !== undefined) {
      updateData.pay_period_label = body.pay_period_label
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes.trim()
    }
    if (body.is_recurring !== undefined) {
      updateData.is_recurring = body.is_recurring === true
    }
    if (body.direction !== undefined) {
      const validDirections = ['owe_employee', 'employee_owes']
      if (!validDirections.includes(body.direction)) {
        return NextResponse.json(
          { success: false, error: 'Invalid direction' },
          { status: 400 }
        )
      }
      updateData.direction = body.direction
    }

    // Always update the timestamp
    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length === 0 || (Object.keys(updateData).length === 1 && updateData.updated_at)) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('payroll_tracker_issues')
      .update(updateData)
      .eq('id', id)
      .select('*, payroll_tracker_issue_attachments(*)')
      .single()

    if (error) throw error

    const mappedIssue = {
      ...data,
      attachments: data.payroll_tracker_issue_attachments ?? [],
    }

    return NextResponse.json({ success: true, issue: mappedIssue })
  } catch (error) {
    console.error('Error updating payroll tracker issue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update issue' },
      { status: 500 }
    )
  }
})
