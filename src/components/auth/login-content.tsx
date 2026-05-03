"use client";

import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";

const ERROR_MESSAGES: Record<string, string> = {
  'auth_callback_error': 'Authentication failed. Please try again.',
  'no_code': 'Invalid authentication response. Please try again.',
  'invalid_user_data': 'Failed to process user data. Please try again.',
  'session_error': 'Failed to create session. Please try again.',
};

export default function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const tab = searchParams.get('tab') as 'login' | 'request' | null;
  const errorMessage = error ? ERROR_MESSAGES[error] || 'An error occurred. Please try again.' : null;

  return (
    <>
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      <AuthForm defaultTab={tab === 'request' ? 'request' : 'login'} />
    </>
  );
}
