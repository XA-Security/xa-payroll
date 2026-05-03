import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { withAuth } from "@/lib/auth"
import { isTokenExpired, refreshAccessToken, encryptToken, calculateExpirationTime, decryptToken } from "@/lib/quickbooks-client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

/**
 * GET /api/quickbooks/payroll/status
 * Returns the current QuickBooks Payroll integration status
 */
export const GET = withAuth(async () => {
  try {
    // Find the QuickBooks Payroll integration (organization-wide)
    const { data: integration, error: queryError } = await supabase
      .from("integrations")
      .select("*")
      .eq("integration_type", "quickbooks_payroll")
      .single()

    if (queryError || !integration) {
      return NextResponse.json(
        {
          connected: false,
          message: "QuickBooks Payroll not connected",
        },
        { status: 200 }
      )
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(integration.token_expires_at)

    if (isTokenExpired(tokenExpiresAt)) {
      // Try to refresh the token
      try {
        const decryptedRefreshToken = decryptToken(integration.refresh_token)
        const newTokens = await refreshAccessToken(decryptedRefreshToken)

        const newExpiresAt = calculateExpirationTime(newTokens.expires_in)
        const encryptedAccessToken = encryptToken(newTokens.access_token)
        const encryptedRefreshToken = encryptToken(newTokens.refresh_token)

        // Update the integration with new tokens using atomic RPC
        const { error: rpcError } = await supabase.rpc('refresh_integration_token', {
          p_integration_id: integration.id,
          p_new_access_token: encryptedAccessToken,
          p_new_refresh_token: encryptedRefreshToken,
          p_new_expires_at: newExpiresAt.toISOString(),
        })
        if (rpcError) {
          console.error('[QBO Payroll Status] RPC token update failed:', rpcError)
        }

        return NextResponse.json({
          connected: true,
          status: "active",
          realmId: integration.settings?.realm_id,
          environment: integration.settings?.environment || "sandbox",
          lastSync: integration.last_sync_at,
          syncStatus: "success",
          tokenExpiresAt: newExpiresAt.toISOString(),
          scopes: integration.scopes || [
            "com.intuit.quickbooks.accounting",
            "employee.read",
            "payroll.compensation.read",
          ],
          message: "QuickBooks Payroll connected and token refreshed",
        })
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError)

        // Update integration with error status
        await supabase
          .from("integrations")
          .update({
            sync_status: "error",
            error_message: `Token refresh failed: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`,
          })
          .eq("id", integration.id)

        return NextResponse.json(
          {
            connected: false,
            status: "token_expired",
            message: "QuickBooks Payroll token expired and refresh failed",
            error: "Please reconnect to QuickBooks Payroll",
            needsReauth: true,
          },
          { status: 200 }
        )
      }
    }

    // Token is still valid
    return NextResponse.json({
      connected: true,
      status: "active",
      realmId: integration.settings?.realm_id,
      environment: integration.settings?.environment || "sandbox",
      lastSync: integration.last_sync_at,
      syncStatus: integration.sync_status,
      tokenExpiresAt: integration.token_expires_at,
      scopes: integration.scopes || [
        "com.intuit.quickbooks.accounting",
        "employee.read",
        "payroll.compensation.read",
      ],
      message: "QuickBooks Payroll connected",
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      { error: "Failed to check QuickBooks Payroll status" },
      { status: 500 }
    )
  }
})
