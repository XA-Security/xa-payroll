import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  exchangePayrollCodeForToken,
  encryptToken,
  calculateExpirationTime,
} from "@/lib/quickbooks-client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

/**
 * GET /api/quickbooks/payroll/auth/callback
 * POST /api/quickbooks/payroll/auth/callback
 * Handles the OAuth callback from QuickBooks Payroll
 * Validates state token and retrieves user context
 */
async function handleCallback(request: NextRequest) {
  // For POST requests, parameters come from query string
  // For GET requests, they also come from query string
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const realmId = searchParams.get("realmId")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Get the base URL for redirects (next.js requires absolute URLs)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  try {
    // Handle error from QuickBooks
    if (error) {
      console.error("[QBO Payroll Callback] QuickBooks OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations/intuit-payroll?status=error&message=${encodeURIComponent(errorDescription || error)}`,
          baseUrl
        )
      )
    }

    if (!code || !realmId || !state) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/integrations/intuit-payroll?status=error&message=Missing code, realmId, or state parameter",
          baseUrl
        )
      )
    }

    // Verify state token exists and hasn't expired
    console.log("[QBO Payroll Callback] Validating state token:", {
      state: `${state?.substring(0, 10)}...`,
      stateLength: state?.length,
    })

    // Query without .single() to avoid PGRST116 error on 0 rows
    const { data: stateRecordsArray, error: stateError } = await supabase
      .from("integrations")
      .select("*")
      .eq("integration_type", "quickbooks_payroll_oauth_state")
      .eq("adp_client_id", state)
      .limit(1)

    const stateRecords = stateRecordsArray?.[0] || null

    if (stateError) {
      console.error("[QBO Payroll Callback] State token query error:", {
        stateError: stateError?.message || stateError?.code,
        stateErrorDetails: stateError,
      })

      return NextResponse.redirect(
        new URL(
          "/dashboard/integrations/intuit-payroll?status=error&message=Database error during validation",
          baseUrl
        )
      )
    }

    if (!stateRecords) {
      console.error("[QBO Payroll Callback] State token not found", {
        searchedFor: `${state?.substring(0, 10)}...`,
      })

      return NextResponse.redirect(
        new URL(
          "/dashboard/integrations/intuit-payroll?status=error&message=Invalid or expired state token",
          baseUrl
        )
      )
    }

    // Check if state token has expired
    const stateExpiresAt = new Date(
      stateRecords.settings?.expires_at || new Date()
    )
    if (new Date() > stateExpiresAt) {
      // Delete expired state token
      await supabase.from("integrations").delete().eq("id", stateRecords.id)

      return NextResponse.redirect(
        new URL(
          "/dashboard/integrations/intuit-payroll?status=error&message=State token expired",
          baseUrl
        )
      )
    }

    // Extract user ID from state record
    const userId = stateRecords.created_by

    // Exchange code for access token using payroll-specific OAuth client
    // The SDK handles state token validation and CSRF protection
    // Pass the full callback URL so the SDK can parse the authorization code
    let tokenResponse
    try {
      tokenResponse = await exchangePayrollCodeForToken(request.url)
    } catch (tokenError) {
      console.error("[QBO Payroll Callback] Token exchange error:", tokenError)
      return NextResponse.redirect(
        new URL(
          "/dashboard/integrations/intuit-payroll?status=error&message=Failed to exchange authorization code",
          baseUrl
        )
      )
    }

    // Calculate token expiration time
    const tokenExpiresAt = calculateExpirationTime(tokenResponse.expires_in)

    // Encrypt tokens for secure storage
    const encryptedAccessToken = encryptToken(tokenResponse.access_token)
    const encryptedRefreshToken = encryptToken(tokenResponse.refresh_token)

    // Save tokens to database (update if exists, insert if new)
    const { data: existingIntegration } = await supabase
      .from("integrations")
      .select("id")
      .eq("integration_type", "quickbooks_payroll")
      .limit(1)
      .single()

    let integrationResult

    if (existingIntegration) {
      // Update existing QuickBooks Payroll integration
      integrationResult = await supabase
        .from("integrations")
        .update({
          service: "quickbooks_payroll",
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          adp_client_id: process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID,
          settings: {
            realm_id: realmId,
            environment: process.env.QUICKBOOKS_ENVIRONMENT || "sandbox",
          },
          connected_at: new Date().toISOString(),
          scopes: [
            "com.intuit.quickbooks.accounting",
            "employee.read",
            "payroll.compensation.read",
          ],
          is_active: true,
          last_sync_at: new Date().toISOString(),
          sync_status: "success",
          error_message: null,
        })
        .eq("id", existingIntegration.id)
        .select()
        .single()
    } else {
      // Create new QuickBooks Payroll integration
      integrationResult = await supabase
        .from("integrations")
        .insert({
          created_by: userId,
          integration_type: "quickbooks_payroll",
          service: "quickbooks_payroll",
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          adp_client_id: process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID,
          settings: {
            realm_id: realmId,
            environment: process.env.QUICKBOOKS_ENVIRONMENT || "sandbox",
          },
          connected_at: new Date().toISOString(),
          scopes: [
            "com.intuit.quickbooks.accounting",
            "employee.read",
            "payroll.compensation.read",
          ],
          is_active: true,
          last_sync_at: new Date().toISOString(),
          sync_status: "success",
        })
        .select()
        .single()
    }

    if (integrationResult.error) {
      console.error("[QBO Payroll Callback] Error saving tokens:", integrationResult.error)
      return NextResponse.redirect(
        new URL(
          "/dashboard/integrations/intuit-payroll?status=error&message=Failed to save connection",
          baseUrl
        )
      )
    }

    // Delete state token after successful completion
    await supabase.from("integrations").delete().eq("id", stateRecords.id)

    // Clean up expired state tokens (optional, helps keep database clean)
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() - 10) // Delete tokens older than 10 minutes
    const { error: cleanupError } = await supabase
      .from("integrations")
      .delete()
      .eq("integration_type", "quickbooks_payroll_oauth_state")
      .lt("created_at", expirationDate.toISOString())

    if (cleanupError) {
      console.warn("[QBO Payroll Callback] State token cleanup warning:", cleanupError)
      // Don't fail the callback due to cleanup errors
    } else {
      console.log("[QBO Payroll Callback] Expired state tokens cleaned up")
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        "/dashboard/integrations/intuit-payroll?status=success&message=QuickBooks+Payroll+connected+successfully",
        baseUrl
      )
    )
  } catch (error) {
    console.error("[QBO Payroll Callback] Callback error:", error)
    return NextResponse.redirect(
      new URL(
        "/dashboard/integrations/intuit-payroll?status=error&message=An unexpected error occurred. Please try connecting again.",
        baseUrl
      )
    )
  }
}

export { handleCallback as GET, handleCallback as POST }
