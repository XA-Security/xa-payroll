import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export const runtime = 'nodejs'

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

// Simple in-memory rate limiter (Vercel will handle persistence)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, maxRequests = 3, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now()
  const record = requestCounts.get(key)

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count < maxRequests) {
    record.count++
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Rate limit by phone number
    if (!checkRateLimit(formattedPhone)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Send verification code using Twilio Verify
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications
      .create({
        to: formattedPhone,
        channel: 'sms'
      })

    return NextResponse.json({
      success: true,
      status: verification.status,
      message: 'Verification code sent successfully'
    })

  } catch (error: unknown) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      {
        error: 'Failed to send verification code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
