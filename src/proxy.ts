import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const MAINTENANCE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
const BYPASS = ["/maintenance", "/_next/", "/favicon", "/Logos/", "/platform-public.png"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle maintenance mode
  if (MAINTENANCE) {
    const isBypassed = BYPASS.some((p) => pathname.startsWith(p));
    if (!isBypassed) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // Handle HEAD requests for dashboard
  if (request.method === "HEAD" && pathname.startsWith("/dashboard")) {
    return new NextResponse(null, { status: 200 });
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Format Supabase URL properly
  const formattedUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}.supabase.co`

  const supabase = createServerClient(
    formattedUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              httpOnly: true,
            })
          )
        },
      },
    }
  )

  // This will refresh the session cookies if the session is still valid
  // This is crucial for PKCE flow to work properly
  // Wrap with timeout to prevent middleware from blocking on Supabase connection issues
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timeout')), 2000)
    )

    await Promise.race([supabase.auth.getUser(), timeoutPromise])
  } catch (error) {
    // Log the error but don't block the request
    // If Supabase is slow/unavailable, we continue anyway
    // The actual page/API will handle auth checking if needed
    if (error instanceof Error && !error.message.includes('timeout')) {
      console.error('[proxy] Auth check error:', error.message)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
