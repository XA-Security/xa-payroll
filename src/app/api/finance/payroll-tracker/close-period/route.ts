import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { pay_period_start } = body

    if (!pay_period_start) {
      return NextResponse.json(
        { success: false, error: 'pay_period_start is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('payroll_tracker_issues')
      .update({ period_archived: true })
      .eq('pay_period_start', pay_period_start)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error closing payroll period:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to close period' },
      { status: 500 }
    )
  }
})
