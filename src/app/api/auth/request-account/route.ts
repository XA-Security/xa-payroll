import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { renderAccountRequestEmail } from '@/lib/email/templates/account-request'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, department, title, email, phone, supervisorName, website } = await request.json()

    // Honeypot check — return silent 200 so bots don't retry
    if (website) {
      return NextResponse.json({
        success: true,
        message: 'Account request submitted successfully',
        requestId: '',
      })
    }

    // Validate required fields
    if (!firstName || !lastName || !phone || !supervisorName) {
      return NextResponse.json(
        { error: 'First name, last name, phone number, and supervisor name are required' },
        { status: 400 }
      )
    }

    // Format phone number to E.164 format
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const supabase = await createClient()

    // Check if there's already a pending request for this phone number
    const { data: existingRequest } = await supabase
      .from('account_requests')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending account request. Please wait for it to be reviewed.' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request for this email
    if (email) {
      const { data: existingEmailRequest } = await supabase
        .from('account_requests')
        .select('id')
        .ilike('email', email)
        .eq('status', 'pending')
        .maybeSingle()

      if (existingEmailRequest) {
        return NextResponse.json(
          { error: 'A pending request with this email already exists.' },
          { status: 400 }
        )
      }
    }

    // Check for recent rejected request by phone (24-hour cooldown)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentRejectedByPhone } = await supabase
      .from('account_requests')
      .select('id')
      .eq('phone', formattedPhone)
      .eq('status', 'rejected')
      .gte('updated_at', twentyFourHoursAgo)
      .maybeSingle()

    if (recentRejectedByPhone) {
      return NextResponse.json(
        { error: 'Your recent account request was reviewed. Please wait 24 hours before reapplying or contact your supervisor.' },
        { status: 400 }
      )
    }

    // Check for recent rejected request by email (24-hour cooldown)
    if (email) {
      const { data: recentRejectedByEmail } = await supabase
        .from('account_requests')
        .select('id')
        .ilike('email', email)
        .eq('status', 'rejected')
        .gte('updated_at', twentyFourHoursAgo)
        .maybeSingle()

      if (recentRejectedByEmail) {
        return NextResponse.json(
          { error: 'Your recent account request was reviewed. Please wait 24 hours before reapplying or contact your supervisor.' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists by phone
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', formattedPhone)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists. Please use the login tab.' },
        { status: 400 }
      )
    }

    // Check if user already exists by email
    if (email) {
      const { data: existingUserByEmail } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email)
        .maybeSingle()

      if (existingUserByEmail) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please use the login tab.' },
          { status: 400 }
        )
      }
    }

    // Create account request
    const { data: accountRequest, error: insertError } = await supabase
      .from('account_requests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        department: department || null,
        title: title || null,
        email: email || null,
        phone: formattedPhone,
        supervisor_name: supervisorName,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Send notification to admin email (fire-and-forget)
    const adminEmail = process.env.RESEND_ADMIN_EMAIL
    if (adminEmail) {
      void (async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digital.xasecurity.ca'
          const reviewUrl = `${appUrl}/dashboard/requests`
          const submittedAt = new Date(accountRequest.created_at || Date.now()).toLocaleDateString(
            'en-US',
            {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          )

          const { subject, html } = renderAccountRequestEmail({
            firstName,
            lastName,
            email: email || null,
            phone: formattedPhone,
            department: department || null,
            title: title || null,
            supervisorName,
            submittedAt,
            reviewUrl,
          })

          await sendEmail({
            to: adminEmail,
            subject,
            html,
          })
        } catch (emailError) {
          console.error('Failed to send account request notification:', emailError)
        }
      })()
    }

    return NextResponse.json({
      success: true,
      message: 'Account request submitted successfully',
      requestId: accountRequest.id,
    })

  } catch (error: unknown) {
    console.error('Error creating account request:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit account request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
