import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionFromCookies } from '@/lib/secure-session'
import { getHumanityAccessToken, fetchEmployeeDetails } from '@/lib/humanity'

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

    const accessToken = await getHumanityAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Humanity API not configured' },
        { status: 503 }
      )
    }

    const employee = await fetchEmployeeDetails(accessToken, session.eid)
    if (!employee?.data) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const emp = employee.data
    const firstName = emp?.firstname || ''
    const lastName = emp?.lastname || ''
    const fullName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : emp?.name || 'Unknown'

    return NextResponse.json({
      humanity_id: session.humanity_id,
      eid: session.eid,
      name: fullName,
      email: emp?.email || session.phone,
      avatar: emp?.photo || emp?.avatar,
      phone: session.phone,
      cell_phone: emp?.cell_phone || emp?.mobile || null,
    })
  } catch (error: unknown) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch employee profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
