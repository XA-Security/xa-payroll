import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    const domain = email.toLowerCase()
    const isValidDomain = domain.endsWith('@xasecurity.ca') || domain.endsWith('@intuit.com')

    if (!isValidDomain) {
      return NextResponse.json(
        { error: 'Only @xasecurity.ca and @intuit.com email addresses are accepted' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Magic link error:', error.message)
      return NextResponse.json(
        { error: 'Failed to send sign-in link. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sign-in link sent successfully',
    })
  } catch (error) {
    console.error('Magic link request failed:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
