"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/browser";
import { authLogger } from "@/lib/auth-logger";

interface AuthFormProps {
  onSuccess?: (user: unknown) => void;
  defaultTab?: "login" | "request";
}

export default function AuthForm({ onSuccess, defaultTab = "login" }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<"login" | "request">(defaultTab);
  const router = useRouter();

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "request");
  };

  return (
    <Card className="w-full shadow-2xl border border-white/30 bg-white">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-black">XA Payroll</CardTitle>
        <CardDescription className="text-balance text-gray-600">
          Sign in to your account or request access
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 bg-white">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
            <TabsTrigger value="login" className="text-black data-[state=active]:text-black data-[state=active]:bg-white">Login</TabsTrigger>
            <TabsTrigger value="request" className="text-gray-600 data-[state=active]:text-black data-[state=active]:bg-white">Request Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm onSuccess={onSuccess} router={router} />
          </TabsContent>

          <TabsContent value="request">
            <RequestAccountForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Login Form Component
function LoginForm({ onSuccess, router }: { onSuccess?: (user: unknown) => void; router: ReturnType<typeof useRouter> }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState("");
  const [magicLinkModalOpen, setMagicLinkModalOpen] = useState(false);
  const supabase = createClient();

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) {
      return digits;
    }if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    authLogger.startTimer('phone_send_code');

    try {
      authLogger.debug('[Auth:Phone]', 'Sending verification code', {
        phoneDigits: phone.replace(/\D/g, '').slice(-4), // Only log last 4 digits
      });

      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        authLogger.warn('[Auth:Phone]', 'Failed to send verification code', {
          status: response.status,
          error: data.error,
        });
        throw new Error(data.error || "Failed to send code");
      }

      authLogger.info('[Auth:Phone]', 'Verification code sent successfully');
      authLogger.endTimer('[Auth:Phone]', 'phone_send_code');
      setStep("code");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      authLogger.error('[Auth:Phone]', 'Phone verification flow failed', err);
      setError(errorMessage || "Failed to send verification code");
      authLogger.endTimer('[Auth:Phone]', 'phone_send_code', 50);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    authLogger.startTimer('phone_verify_code');

    try {
      authLogger.debug('[Auth:Phone]', 'Verifying code', {
        codeLength: code.length,
        phoneDigits: phone.replace(/\D/g, '').slice(-4),
      });

      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();
      if (!response.ok) {
        authLogger.warn('[Auth:Phone]', 'Code verification failed', {
          status: response.status,
          error: data.error,
        });
        throw new Error(data.error || "Failed to verify code");
      }

      authLogger.info('[Auth:Phone]', 'Code verified successfully', {
        userId: data.user?.id,
      });

      // Session cookies are now set server-side (httpOnly) in the verify-code route.
      // No client-side setSession() needed.
      localStorage.setItem("xa_user", JSON.stringify(data.user));
      authLogger.endTimer('[Auth:Phone]', 'phone_verify_code');

      if (onSuccess) {
        onSuccess(data.user);
      } else {
        authLogger.debug('[Auth:Phone]', 'Redirecting to dashboard');
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      authLogger.error('[Auth:Phone]', 'Code verification failed', err);
      setError(errorMessage || "Failed to verify code");
      authLogger.endTimer('[Auth:Phone]', 'phone_verify_code', 50);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError("");
    authLogger.startTimer('microsoft_login');

    try {
      // Use environment variable if available (for consistent redirect across environments)
      // Falls back to window.location.origin for client-side compatibility
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectUrl = `${appUrl}/auth/callback`;

      authLogger.info('[Auth:OAuth]', 'Initiating Microsoft Azure OAuth flow', {
        origin: window.location.origin,
        redirectUrl: redirectUrl,
        provider: 'azure',
      });

      authLogger.debug('[Auth:OAuth]', 'Current Supabase auth state', {
        hasSession: await supabase.auth.getSession().then((r: any) => !!r.data?.session),
      });

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email',
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        const errorInfo = error as unknown as Record<string, unknown>;
        authLogger.error('[Auth:OAuth]', 'OAuth sign-in request failed', {
          error: error.message,
          status: errorInfo.status,
          code: errorInfo.code,
        });
        throw error;
      }

      authLogger.debug('[Auth:OAuth]', 'OAuth request submitted successfully', {
        redirectUrl: data?.url?.substring(0, 100), // Log first 100 chars of redirect URL
      });

      authLogger.info('[Auth:OAuth]', 'OAuth flow initiated, waiting for redirect to Microsoft...');
      authLogger.endTimer('[Auth:OAuth]', 'microsoft_login');
    } catch (err: unknown) {
      authLogger.error('[Auth:OAuth]', 'Microsoft login failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage || "Failed to sign in with Microsoft");
      setLoading(false);
      authLogger.endTimer('[Auth:OAuth]', 'microsoft_login', 50);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicError("");

    const domain = magicEmail.toLowerCase();
    const isValidDomain = domain.endsWith("@xasecurity.ca") || domain.endsWith("@intuit.com");

    if (!isValidDomain) {
      setMagicError("Only @xasecurity.ca and @intuit.com email addresses are accepted.");
      return;
    }

    setMagicLoading(true);
    authLogger.startTimer("magic_link_request");

    try {
      authLogger.info("[Auth:MagicLink]", "Requesting magic link", {
        email: magicEmail,
      });

      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        authLogger.error("[Auth:MagicLink]", "Magic link request failed", data);
        setMagicError(data.error || "Failed to send magic link");
      } else {
        authLogger.info("[Auth:MagicLink]", "Magic link sent successfully");
        authLogger.endTimer("[Auth:MagicLink]", "magic_link_request");
        setMagicLinkSent(true);
      }
    } catch (err: unknown) {
      authLogger.error("[Auth:MagicLink]", "Magic link flow failed", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setMagicError(errorMessage || "Failed to send magic link");
      authLogger.endTimer("[Auth:MagicLink]", "magic_link_request", 50);
    } finally {
      setMagicLoading(false);
    }
  };

  if (step === "code") {
    return (
      <form onSubmit={handleCodeSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-black">Verification Code</Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={loading}
            maxLength={6}
            className="text-center text-lg tracking-widest bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
          />
          <p className="text-sm text-gray-600 text-center">
            We sent a code to {formatPhoneNumber(phone)}
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
            }}
            disabled={loading}
          >
            Use Different Number
          </Button>
        </div>
      </form>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-8">
          <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-black">Check your email</h3>
          <p className="text-sm text-gray-600">
            We've sent a magic link to <strong>{magicEmail}</strong>. Click it to sign in.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-gray-700 hover:bg-gray-100"
          onClick={() => {
            setMagicLinkSent(false);
            setMagicEmail("");
            setMagicError("");
          }}
        >
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-black">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 000-0000"
              value={formatPhoneNumber(phone)}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading || magicLoading}
              className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
            disabled={loading || magicLoading}
          >
            {loading ? "Sending..." : "Send Code"}
          </Button>
        </form>

        <div className="my-6">
          <div className="relative flex justify-center text-xs uppercase">
            <span className="text-gray-500">
              Or sign in with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-gray-50 border-gray-200 text-black hover:bg-gray-100"
          onClick={handleMicrosoftLogin}
          disabled={loading || magicLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
            <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          {loading ? "Redirecting..." : "Sign in with Microsoft"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-gray-50 border-gray-200 text-black hover:bg-gray-100 mt-2"
          onClick={() => setMagicLinkModalOpen(true)}
          disabled={loading || magicLoading}
        >
          Sign in with Email
        </Button>
      </div>

      <MagicLinkModal
        isOpen={magicLinkModalOpen}
        onOpenChange={setMagicLinkModalOpen}
        magicEmail={magicEmail}
        setMagicEmail={setMagicEmail}
        magicError={magicError}
        setMagicError={setMagicError}
        magicLoading={magicLoading}
        magicLinkSent={magicLinkSent}
        setMagicLinkSent={setMagicLinkSent}
        onSubmit={handleMagicLinkSubmit}
      />
    </>
  );
}

// Magic Link Modal Component
interface MagicLinkModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  magicEmail: string;
  setMagicEmail: (email: string) => void;
  magicError: string;
  setMagicError: (error: string) => void;
  magicLoading: boolean;
  magicLinkSent: boolean;
  setMagicLinkSent: (sent: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function MagicLinkModal({
  isOpen,
  onOpenChange,
  magicEmail,
  setMagicEmail,
  magicError,
  setMagicError,
  magicLoading,
  magicLinkSent,
  setMagicLinkSent,
  onSubmit,
}: MagicLinkModalProps) {
  const handleClose = () => {
    if (!magicLoading) {
      setMagicEmail("");
      setMagicError("");
      setMagicLinkSent(false);
      onOpenChange(false);
    }
  };

  if (magicLinkSent) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Check your email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 text-center">
              We've sent a magic link to <strong>{magicEmail}</strong>. Click it to sign in.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setMagicLinkSent(false);
              setMagicEmail("");
              setMagicError("");
            }}
          >
            Try a different email
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Sign in with Email</DialogTitle>
          <DialogDescription className="text-gray-600">
            Enter your @xasecurity.ca or @intuit.com email address to receive a sign-in link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-magic-email" className="text-black">Email</Label>
            <Input
              id="modal-magic-email"
              type="email"
              placeholder="you@xasecurity.ca"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              required
              disabled={magicLoading}
              className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
            />
          </div>

          {magicError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
              {magicError}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-gray-700 hover:bg-gray-100"
              onClick={handleClose}
              disabled={magicLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
              disabled={magicLoading}
            >
              {magicLoading ? "Sending..." : "Send Link"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Request Account Form Component
function RequestAccountForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    email: "",
    phone: "",
    supervisorName: "",
    website: "", // Honeypot field
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/request-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit request");

      setSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        department: "",
        email: "",
        phone: "",
        supervisorName: "",
        website: "",
      });
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Unknown error') || "Failed to submit account request");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) {
      return digits;
    }if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold">Request Submitted!</h3>
        <p className="text-muted-foreground">
          Your account request has been submitted successfully. You will receive a notification once it has been reviewed.
        </p>
        <Button variant="outline" onClick={() => setSuccess(false)}>
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field — hidden from humans, filled by bots */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <Input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-black">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            disabled={loading}
            className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-black">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            disabled={loading}
            className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department" className="text-black">Department</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          disabled={loading}
          className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-black">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
          className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-black">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 000-0000"
          value={formatPhoneNumber(formData.phone)}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          disabled={loading}
          className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supervisorName" className="text-black">Supervisor&apos;s Name *</Label>
        <Input
          id="supervisorName"
          value={formData.supervisorName}
          onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
          required
          disabled={loading}
          className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
        />
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold" disabled={loading}>
        {loading ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}
