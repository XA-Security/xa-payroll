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
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      humanity_id: session.humanity_id,
      eid: session.eid,
      name: employee.name || employee.firstname ? `${employee.firstname} ${employee.lastname}` : 'Unknown',
      email: employee.email || session.phone,
      avatar: employee.photo || employee.avatar,
      phone: session.phone,
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
