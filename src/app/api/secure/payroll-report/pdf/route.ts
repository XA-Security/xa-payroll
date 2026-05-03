import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { renderToStream } from '@react-pdf/renderer'
import { getSessionFromCookies } from '@/lib/secure-session'
import { getHumanityAccessToken, fetchEmployeeDetails, fetchPayrollReport } from '@/lib/humanity'
import { PayrollPdfTemplate } from '@/components/secure/PayrollPdfTemplate'

export const runtime = 'nodejs'

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

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
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

    // Fetch employee details
    const employee = await fetchEmployeeDetails(accessToken, session.eid)
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Fetch payroll data
    const payrollData = await fetchPayrollReport(accessToken, startDate, endDate)

    // Filter entries to only include this employee
    const filteredEntries: PayrollEntry[] = payrollData.filter(
      (entry: any) => String(entry.userid) === String(session.humanity_id)
    )

    // Render PDF to stream
    const document = PayrollPdfTemplate({
      employee: {
        name: employee.name || employee.firstname ? `${employee.firstname} ${employee.lastname}` : 'Unknown',
        eid: session.eid,
        email: employee.email || session.phone,
      },
      entries: filteredEntries,
      startDate,
      endDate,
    })

    const stream = await renderToStream(document)

    // Return PDF response
    return new Response(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payroll-${startDate}-to-${endDate}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: unknown) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
