import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import twilio from 'twilio'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { encryptSession, SESSION_COOKIE_NAME, createSessionCookieOptions } from '@/lib/secure-session'

export const runtime = 'nodejs'

interface StaffListRow {
  id: string
  humanity_id: string
  eid: string
  firstName: string | null
  lastName: string | null
  fullName: string | null
  email: string | null
  phone: string | null
  status: string | null
}

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

const validCredentials = accountSid &&
  authToken &&
  verifyServiceSid &&
  accountSid.startsWith('AC') &&
  !accountSid.includes('your_') &&
  !authToken.includes('your_') &&
  !verifyServiceSid.includes('your_')

const client = validCredentials ? twilio(accountSid, authToken) : null

if (!validCredentials) {
  console.warn('Twilio credentials not configured. SMS will not work.')
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      )
    }

    if (!client || !verifyServiceSid) {
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 503 }
      )
    }

    // Format phone number to E.164 format
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`

    // Verify the code using Twilio Verify
    let verification
    try {
      verification = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks
        .create({
          to: formattedPhone,
          code: code
        })
    } catch (error: any) {
      // Handle specific Twilio errors
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'This code has already been used or expired. Please request a new code.' },
          { status: 400 }
        )
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Too many attempts. Please wait before trying again.' },
          { status: 429 }
        )
      }
      throw error
    }

    if (verification.status !== 'approved') {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Use admin client to query staff_list
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch employee from staff_list by phone number
    const { data: staffMember, error: staffError } = await supabaseAdmin
      .from('staff_list')
      .select('*')
      .eq('phone', formattedPhone)
      .single() as unknown as { data: StaffListRow | null; error: any }

    if (staffError && staffError.code !== 'PGRST116') {
      throw staffError
    }

    if (!staffMember) {
      return NextResponse.json(
        { error: "We couldn't find an account linked to this number. Please contact your supervisor." },
        { status: 404 }
      )
    }

    // Create encrypted session
    const sessionPayload = {
      humanity_id: staffMember.humanity_id,
      eid: staffMember.eid,
      phone: formattedPhone,
      exp: Date.now() + 8 * 60 * 60 * 1000
    }

    const encryptedSession = encryptSession(sessionPayload)

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, encryptedSession, createSessionCookieOptions())

    return NextResponse.json({
      success: true
    })

  } catch (error: unknown) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
