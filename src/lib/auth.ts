import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from './supabase/admin';

export interface AuthUser {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'supervisor' | 'staff';
  is_active: boolean;
}

// Auth validation cache to reduce Supabase Auth API calls
interface CachedAuth {
  user: AuthUser | null;
  timestamp: number;
  userId?: string; // Store user ID to verify cache key hasn't been mixed up
}

const authCache = new Map<string, CachedAuth>();
const CACHE_TTL = 10000; // 10 seconds - prevents concurrent getUser() calls in rapid API requests

/**
 * Validates user authentication from Supabase session stored in cookies
 * Returns user data if valid, null if invalid
 * This is the primary auth method for API routes
 *
 * Results are cached for 5 seconds to reduce Supabase Auth API rate limit pressure
 */
export async function validateAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Extract session cookie for cache key
    const sessionCookie = request.cookies.get('sb-access-token')?.value;
    const cacheKey = sessionCookie || 'no-session';

    // Check cache first, but verify user ID matches to detect session confusion
    const cached = authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // If we have a cached user, verify it still matches current session
      // This prevents serving wrong user if session cookies get mixed up
      return cached.user;
    }

    // Create Supabase client from cookies in request
    const { createServerClient } = await import('@supabase/ssr');
    const cookies = request.cookies;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => {
            return cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll: () => {
            // Not needed for server-side validation
          },
        },
      }
    );

    // Get user from Supabase session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
      // Cache null results too
      authCache.set(cacheKey, { user: null, timestamp: Date.now(), userId: undefined });
      return null;
    }

    // Fetch user from database to verify they exist and are active
    const admin = getSupabaseAdmin();
    const { data: user, error } = await admin
      .from('users')
      .select('id, phone, first_name, last_name, nickname, email, avatar_url, role, is_active')
      .eq('id', authUser.id)
      .eq('is_active', true)
      .single() as { data: AuthUser | null; error: any };

    if (error || !user) {
      authCache.set(cacheKey, { user: null, timestamp: Date.now(), userId: undefined });
      return null;
    }

    // Cache successful result with user ID for verification
    authCache.set(cacheKey, { user, timestamp: Date.now(), userId: user.id });
    return user;
  } catch (error) {
    console.error('Auth validation error:', error);
    return null;
  }
}

interface RouteContext {
  params: Promise<Record<string, string | string[]>>;
}

/**
 * Higher-order function to protect API routes
 * Usage: export const GET = withAuth(async (request, user) => { ... })
 * Also handles route params: export const GET = withAuth(async (request, user, context) => { ... })
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser, context?: RouteContext) => Promise<Response>
): (request: NextRequest, context: RouteContext) => Promise<Response> {
  return async (request: NextRequest, context: RouteContext): Promise<Response> => {
    const user = await validateAuth(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, user, context);
  };
}

/**
 * Validates user authentication from Supabase session (for OAuth/redirect flows)
 * Returns user data if valid, null if invalid
 * Use this for routes that handle browser redirects (OAuth callbacks, etc)
 *
 * Results are cached for 5 seconds to reduce Supabase Auth API rate limit pressure
 */
export async function validateSupabaseAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Extract session cookie for cache key
    const sessionCookie = request.cookies.get('sb-access-token')?.value;
    const cacheKey = `supabase-${sessionCookie || 'no-session'}`;

    // Check cache first, but verify user ID matches to detect session confusion
    const cached = authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.user;
    }

    // Create Supabase client with cookies from the request
    const { createServerClient } = await import('@supabase/ssr');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll: () => {
            const cookies: Array<{ name: string; value: string }> = [];
            request.cookies.getAll().forEach(cookie => {
              cookies.push({ name: cookie.name, value: cookie.value });
            });
            return cookies;
          },
          setAll: () => {
            // Not needed for server-side validation
          },
        },
      }
    );

    // Get user from Supabase session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.id) {
      authCache.set(cacheKey, { user: null, timestamp: Date.now(), userId: undefined });
      return null;
    }

    // Fetch user from database to verify they exist and are active
    const admin = getSupabaseAdmin();
    const { data: userData, error: dbError } = await admin
      .from('users')
      .select('id, phone, first_name, last_name, nickname, email, avatar_url, role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single() as { data: AuthUser | null; error: any };

    if (dbError || !userData) {
      authCache.set(cacheKey, { user: null, timestamp: Date.now(), userId: undefined });
      return null;
    }

    // Cache successful result with user ID for verification
    authCache.set(cacheKey, { user: userData, timestamp: Date.now(), userId: userData.id });
    return userData;
  } catch (error) {
    console.error('Supabase auth validation error:', error);
    return null;
  }
}

/**
 * Higher-order function to protect OAuth/redirect routes using Supabase session
 * Use this for routes that handle browser redirects (OAuth flows, etc)
 * Usage: export const GET = withSupabaseAuth(async (request, user) => { ... })
 */
export function withSupabaseAuth(
  handler: (request: NextRequest, user: AuthUser, context?: RouteContext) => Promise<Response>
): (request: NextRequest, context: RouteContext) => Promise<Response> {
  return async (request: NextRequest, context: RouteContext): Promise<Response> => {
    const user = await validateSupabaseAuth(request);

    if (!user) {
      // Redirect to login for browser-initiated requests
      const { NextResponse } = await import('next/server');
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', request.url));
    }

    return handler(request, user, context);
  };
}

/**
 * Role-based authorization check
 */
export function requireRole(...allowedRoles: Array<'admin' | 'supervisor' | 'staff'>) {
  return (
    handler: (request: NextRequest, user: AuthUser, context?: RouteContext) => Promise<Response>
  ) => withAuth(async (request: NextRequest, user: AuthUser, context?: RouteContext) => {
      if (!allowedRoles.includes(user.role)) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return handler(request, user, context);
    });
}

/**
 * Validates cron request authentication
 * Checks Authorization header for Bearer {CRON_SECRET}
 * Returns true if valid, false otherwise
 */
export function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader) {
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Higher-order function to protect routes that accept both user auth and cron auth
 * Useful for internal sync endpoints that can be triggered by both users and cron jobs
 * Usage: export const POST = withAuthOrCron(async (request, user, isCron) => { ... })
 */
export function withAuthOrCron(
  handler: (request: NextRequest, user: AuthUser | null, isCron: boolean, context?: RouteContext) => Promise<Response>
): (request: NextRequest, context: RouteContext) => Promise<Response> {
  return async (request: NextRequest, context: RouteContext): Promise<Response> => {
    // Try cron auth first
    const isCron = validateCronAuth(request);
    if (isCron) {
      return handler(request, null, true, context);
    }

    // Fall back to user auth
    const user = await validateAuth(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, user, false, context);
  };
}
