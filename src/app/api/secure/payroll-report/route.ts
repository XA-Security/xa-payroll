import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionFromCookies } from '@/lib/secure-session'
import { getHumanityAccessToken, fetchPayrollReport } from '@/lib/humanity'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = await getSessionFromCookies(cookieStore)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Don't allow future end dates
    if (endDate > new Date().toISOString().split('T')[0]) {
      return NextResponse.json(
        { error: 'End date cannot be in the future' },
        { status: 400 }
      )
    }

    const accessToken = await getHumanityAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Humanity API not configured' },
        { status: 503 }
      )
    }

    const payrollData = await fetchPayrollReport(accessToken, startDate, endDate)

    // Filter entries to only include this employee
    const filteredEntries = payrollData.data.filter(
      (entry: any) => String(entry.userid) === String(session.humanity_id)
    )

    return NextResponse.json({
      entries: filteredEntries,
      count: filteredEntries.length,
      startDate,
      endDate,
    })
  } catch (error: unknown) {
    console.error('Error fetching payroll report:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch payroll report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
