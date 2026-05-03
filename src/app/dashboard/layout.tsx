import type React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authLogger } from "@/lib/auth-logger";
import { AuthProvider } from "@/components/auth-context";
import DashboardLayoutClient from "./layout-client";

/**
 * Server Component: Validates authentication and fetches user data
 * Then passes to client component for rendering
 */
async function DashboardLayoutServer({ children }: { children: React.ReactNode }) {
  authLogger.debug('[Auth:Dashboard]', 'DashboardLayout server component rendering');

  const supabase = await createClient();

  // Get authenticated user from Supabase session
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    authLogger.warn('[Auth:Dashboard]', 'No authenticated user, redirecting to login');
    redirect('/auth/login');
  }

  // Fetch user profile data from our users table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('id, first_name, last_name, nickname, email, phone, avatar_url, title, role, is_active, profile_completed, release_seen')
    .eq('id', authUser.id)
    .single();

  if (profileError || !userProfile) {
    authLogger.error('[Auth:Dashboard]', 'Failed to fetch user profile', { error: profileError });
    redirect('/auth/login?error=profile_not_found');
  }

  if (!userProfile.is_active) {
    authLogger.warn('[Auth:Dashboard]', 'User is not active', { userId: authUser.id });
    redirect('/auth/login?error=user_inactive');
  }

  // Format user data for client components
  const userData = {
    id: userProfile.id,
    first_name: userProfile.first_name,
    last_name: userProfile.last_name,
    nickname: userProfile.nickname,
    email: userProfile.email,
    phone: userProfile.phone,
    avatar_url: userProfile.avatar_url,
    title: userProfile.title,
    role: userProfile.role,
    profile_completed: userProfile.profile_completed,
    release_seen: userProfile.release_seen,
  };

  const sidebarUser = {
    name:
      userProfile.nickname ||
      (userProfile.first_name && userProfile.last_name
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : userProfile.email || userProfile.phone || 'User'),
    email: userProfile.email || userProfile.phone || 'user@xasecurity.ca',
    avatar: userProfile.avatar_url,
  };

  authLogger.setContext({ userId: authUser.id, email: userProfile.email });
  authLogger.debug('[Auth:Dashboard]', 'User authenticated successfully', {
    userId: authUser.id,
    email: userProfile.email,
  });

  return (
    <AuthProvider initialUser={userData}>
      <div suppressHydrationWarning>
        <DashboardLayoutClient sidebarUser={sidebarUser}>
          {children}
        </DashboardLayoutClient>
      </div>
    </AuthProvider>
  );
}

// Export the server component as the default layout
export default DashboardLayoutServer;
