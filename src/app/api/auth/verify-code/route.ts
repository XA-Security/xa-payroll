import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

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

    // Use admin client to bypass RLS when creating/linking auth users
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch user profile by phone number first (to get the correct user record)
    const { data: existingUser, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('is_active', true)
      .single() as { data: Database['public']['Tables']['users']['Row'] | null; error: any }

    if (userFetchError && userFetchError.code !== 'PGRST116') {
      throw userFetchError
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. Please contact your administrator.' },
        { status: 401 }
      )
    }

    // Check if auth user exists using the user ID from the users table
    const { data: authUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(existingUser.id)

    const authUserWithPhone = getUserError ? null : authUserData?.user ?? null

    let authUserId: string
    let authUserEmail: string

    if (authUserWithPhone) {
      // Auth user already exists - use it
      authUserId = authUserWithPhone.id
      authUserEmail = authUserWithPhone.email || `phone-${formattedPhone.replace('+', '')}@xa.local`
    } else {
      // Create new auth user with matching ID
      const tempEmail = existingUser.email || `phone-${formattedPhone.replace('+', '')}@xa.local`

      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        id: existingUser.id,
        phone: formattedPhone,
        email: tempEmail,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: {
          phone_verified: true,
          verified_at: new Date().toISOString()
        }
      })

      if (authError) {
        // If email_exists error, the auth user already exists (someone else with same email)
        if (authError.status === 422 && authError.code === 'email_exists') {
          console.warn('Auth user already exists with this email, using existing auth user', {
            email: tempEmail,
            phone: formattedPhone
          })

          // Fetch all auth users and find by email (fallback for email conflict)
          const { data: allAuthUsersData, error: allUsersError } = await supabaseAdmin.auth.admin.listUsers()
          if (!allUsersError && allAuthUsersData?.users) {
            const existingAuthUserByEmail = allAuthUsersData.users.find(u => u.email?.toLowerCase() === tempEmail.toLowerCase())
            if (existingAuthUserByEmail) {
              authUserId = existingAuthUserByEmail.id
              authUserEmail = existingAuthUserByEmail.email || tempEmail
            } else {
              console.error('Auth user exists but could not find it by email')
              throw authError
            }
          } else {
            console.error('Could not list auth users to find email conflict')
            throw allUsersError || authError
          }
        } else {
          console.error('Error creating auth user:', authError)
          throw authError
        }
      } else {
        if (!newAuthUser?.user?.id) {
          throw new Error('Failed to create auth user: no ID returned')
        }

        authUserId = newAuthUser.user.id
        authUserEmail = tempEmail
      }
    }


    // Generate a magic link token to create a session
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authUserEmail
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Error generating magic link:', linkError)
      throw linkError || new Error('Failed to generate magic link')
    }

    // Verify the token to create a session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink'
    })

    if (sessionError || !sessionData?.session) {
      console.error('Error creating session:', sessionError)
      throw sessionError || new Error('Failed to create session')
    }

    const session = sessionData.session

    if (!session.access_token || !session.refresh_token) {
      throw new Error('Session tokens missing from response')
    }

    // Set session cookies server-side so httpOnly cookies are correctly established.
    // The browser client cannot write httpOnly cookies, so we must do it here.
    const serverClient = await createClient()
    await serverClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authUserId,
        phone: existingUser.phone,
        first_name: existingUser.first_name,
        last_name: existingUser.last_name,
        email: existingUser.email || authUserEmail,
        role: existingUser.role
      },
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