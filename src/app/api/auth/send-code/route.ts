import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

// Check if credentials are valid (not placeholder values)
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