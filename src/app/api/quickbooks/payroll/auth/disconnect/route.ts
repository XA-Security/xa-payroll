import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { withAuth } from "@/lib/auth"
import { decryptToken, revokeToken } from "@/lib/quickbooks-client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

/**
 * POST /api/quickbooks/payroll/auth/disconnect
 * Revokes the QuickBooks Payroll OAuth connection
 */
export const POST = withAuth(async () => {
  try {
    // Find the QuickBooks Payroll integration (organization-wide)
    const { data: integration, error: queryError } = await supabase
      .from("integrations")
      .select("*")
      .eq("integration_type", "quickbooks_payroll")
      .single()

    if (queryError) {
      return NextResponse.json(
        { error: "QuickBooks Payroll integration not found" },
        { status: 404 }
      )
    }

    // Decrypt and revoke the access token
    if (integration.access_token) {
      try {
        const accessToken = decryptToken(integration.access_token)
        await revokeToken(accessToken)
      } catch (revokeError) {
        console.warn("Failed to revoke token with QuickBooks:", revokeError)
        // Continue with local cleanup even if revoke fails
      }
    }

    // Delete the integration record
    const { error: deleteError } = await supabase
      .from("integrations")
      .delete()
      .eq("id", integration.id)

    if (deleteError) {
      console.error("Error deleting integration:", deleteError)
      return NextResponse.json(
        { error: "Failed to disconnect from QuickBooks Payroll" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully disconnected from QuickBooks Payroll",
    })
  } catch (error) {
    console.error("Disconnect error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect from QuickBooks Payroll" },
      { status: 500 }
    )
  }
})
