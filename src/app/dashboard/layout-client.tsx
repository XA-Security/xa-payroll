"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BreadcrumbProvider, useBreadcrumbs } from "@/components/breadcrumb-context";
import { Toaster } from "@/components/ui/sonner";
import { authLogger } from "@/lib/auth-logger";
import { useAuth } from "@/components/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  sidebarUser?: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}

function DashboardLayoutContent({
  children,
  sidebarUser,
}: DashboardLayoutClientProps & { sidebarUser?: DashboardLayoutClientProps['sidebarUser'] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { breadcrumbs } = useBreadcrumbs();
  const { user, setUser, setIsReady } = useAuth();

  // Refetch user data from the API when explicitly requested (e.g., after profile updates)
  const fetchUserData = useCallback(
    async (userId: string) => {
      authLogger.startTimer('fetch_user_data');
      try {
        authLogger.debug('[Auth:Dashboard]', 'Refreshing user data from API', { userId });
        const response = await fetch(`/api/profile/me?userId=${userId}`);
        if (!response.ok) {
          authLogger.error('[Auth:Dashboard]', 'Failed to fetch user data', {
            status: response.status,
            statusText: response.statusText,
          });
          throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        console.log('[Dashboard:fetchUserData] Retrieved user data:', {
          userId: userData.id,
          profile_completed: userData.profile_completed,
          title: userData.title
        });
        setUser(userData);
        authLogger.setContext({ userId: userData.id, email: userData.email });
        authLogger.debug('[Auth:Dashboard]', 'User data refreshed', {
          userId: userData.id,
          profile_completed: userData.profile_completed
        });
        authLogger.endTimer('[Auth:Dashboard]', 'fetch_user_data', 500);
      } catch (error) {
        authLogger.error('[Auth:Dashboard]', 'Error fetching user data', error);
        authLogger.endTimer('[Auth:Dashboard]', 'fetch_user_data', 500);
        router.push('/auth/login');
      }
    },
    [router, setUser]
  );

  useEffect(() => {
    authLogger.startTimer('dashboard_auth_init');
    authLogger.debug('[Auth:Dashboard]', 'Initializing dashboard client component');

    const abortController = new AbortController();

    // On fresh login, load user data from the Supabase session
    const initDashboard = async () => {
      if (user?.id) {
        authLogger.debug('[Auth:Dashboard]', 'User already loaded', { userId: user.id });
        setIsReady(true);

        // Handle first-time Microsoft welcome flag
        if (searchParams.get('welcome') === '1') {
          authLogger.info('[Auth:Dashboard]', 'First-time Microsoft user, showing welcome');
          setShowMicrosoftWelcome(true);
          router.replace('/dashboard');
        }
        return;
      }

      authLogger.debug('[Auth:Dashboard]', 'Loading user from session and fetching profile');
      const supabase = getSupabaseBrowserClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        authLogger.warn('[Auth:Dashboard]', 'No authenticated user found');
        router.push('/auth/login');
        return;
      }

      await fetchUserData(authUser.id);
      setIsReady(true);
      authLogger.endTimer('[Auth:Dashboard]', 'dashboard_auth_init');
    };

    initDashboard();

    // Listen for user-updated events to refresh data from API
    const handleUserUpdate = () => {
      if (abortController.signal.aborted) return;
      if (user?.id) {
        authLogger.debug('[Auth:Dashboard]', 'User updated event received, refreshing data from API');
        fetchUserData(user.id);
      }
    };

    window.addEventListener('user-updated', handleUserUpdate);

    return () => {
      abortController.abort();
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, [router, searchParams, fetchUserData, user, setUser, setIsReady]);

  // Sync user data to localStorage whenever it changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('xa_user', JSON.stringify(user));
    }
  }, [user]);

  // Memoize sidebar user data to prevent unnecessary AppSidebar re-renders
  // Always prefer live AuthContext values (user) over stale SSR snapshot (sidebarUser)
  const memoizedSidebarUser = useMemo(() => {
    return {
      name:
        user?.nickname ||
        (user?.first_name || user?.last_name
          ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
          : '') ||
        user?.email ||
        sidebarUser?.name ||
        undefined,
      email: user?.email || user?.phone || sidebarUser?.email || undefined,
      avatar: user?.avatar_url || sidebarUser?.avatar || undefined,
    };
  }, [sidebarUser, user?.nickname, user?.first_name, user?.last_name, user?.email, user?.phone, user?.avatar_url]);

  // Bypass sidebar layout for fullscreen present route
  if (pathname === '/dashboard/present') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        userId={user?.id}
        user={memoizedSidebarUser}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center justify-between w-full">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.href}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {breadcrumb.href ? (
                        <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
      </SidebarInset>

      <Toaster />
    </SidebarProvider>
  );
}

function Boundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BreadcrumbProvider>{children}</BreadcrumbProvider>
    </Suspense>
  );
}

export default function DashboardLayoutClient({ children, sidebarUser }: DashboardLayoutClientProps) {
  return (
    <Boundary>
      <DashboardLayoutContent sidebarUser={sidebarUser}>{children}</DashboardLayoutContent>
    </Boundary>
  );
}
