import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { withAuth } from "@/lib/auth"
import { refreshAccessToken, encryptToken, calculateExpirationTime, decryptToken } from "@/lib/quickbooks-client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

/**
 * POST /api/quickbooks/payroll/refresh-token
 * Manually refresh the QuickBooks Payroll access token
 */
export const POST = withAuth(async () => {
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
          error: "QuickBooks Payroll integration not found",
          connected: false,
        },
        { status: 404 }
      )
    }

    // Refresh the token
    try {
      const decryptedRefreshToken = decryptToken(integration.refresh_token)
      const newTokens = await refreshAccessToken(decryptedRefreshToken)

      const newExpiresAt = calculateExpirationTime(newTokens.expires_in)
      const encryptedAccessToken = encryptToken(newTokens.access_token)
      const encryptedRefreshToken = encryptToken(newTokens.refresh_token)

      // Update the integration with new tokens
      const { error: updateError } = await supabase
        .from("integrations")
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: newExpiresAt.toISOString(),
          sync_status: "success",
          error_message: null,
        })
        .eq("id", integration.id)

      if (updateError) {
        throw new Error(`Failed to update integration: ${updateError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "Access token refreshed successfully",
        expiresAt: newExpiresAt.toISOString(),
        expiresIn: newTokens.expires_in,
      })
    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError)

      console.error("Token refresh failed:", {
        error: errorMessage,
        errorType: refreshError?.constructor?.name,
      })

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
          error: refreshError instanceof Error ? refreshError.message : "Token refresh failed",
          success: false,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Refresh token endpoint error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
      },
      { status: 500 }
    )
  }
})
