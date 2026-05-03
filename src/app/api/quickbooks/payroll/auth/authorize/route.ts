import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generatePayrollAuthorizationUrl } from "@/lib/quickbooks-client"
import crypto from "node:crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

/**
 * POST /api/quickbooks/payroll/auth/authorize
 * Initiates the OAuth flow for QuickBooks Payroll by generating a state token and returning authorization URL
 * Requires x-user-id header for user identification
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from request header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Missing user ID" },
        { status: 401 }
      )
    }

    // Generate state token for CSRF protection and user tracking
    const stateToken = crypto.randomBytes(32).toString("hex")

    // Store state token in database temporarily (expires in 10 minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Store state token for validation later
    // Use unique service name to avoid UNIQUE constraint conflicts with actual integration
    const stateService = `quickbooks_payroll_oauth_state_${Date.now()}`

    console.log("[QBO Payroll Authorize] Storing state token:", {
      userId: userId?.substring(0, 8),
      stateToken: `${stateToken.substring(0, 10)}...`,
      stateLength: stateToken.length,
      stateService,
      expiresAt: expiresAt.toISOString(),
    })

    const { error: stateError, data: insertedData } = await supabase
      .from("integrations")
      .insert({
        created_by: userId,
        integration_type: "quickbooks_payroll_oauth_state",
        service: stateService,
        adp_client_id: stateToken,
        settings: { expires_at: expiresAt.toISOString() },
      })
      .select()

    if (stateError) {
      console.error("[QBO Payroll Authorize] Error storing state token:", {
        stateError: stateError?.message || stateError?.code,
        stateErrorDetails: stateError,
        insertedData,
      })
      return NextResponse.json(
        { error: "Failed to initialize OAuth flow" },
        { status: 500 }
      )
    }

    console.log("[QBO Payroll Authorize] State token stored successfully:", {
      recordId: insertedData?.[0]?.id?.substring(0, 8),
      recordCount: insertedData?.length,
    })

    // Generate QuickBooks authorization URL with state token (payroll scopes)
    const authorizationUrl = generatePayrollAuthorizationUrl(stateToken)

    return NextResponse.json({
      redirectUrl: authorizationUrl
    })
  } catch (error) {
    console.error("[QBO Payroll Authorize] Authorization error:", error)
    return NextResponse.json(
      { error: "Failed to initiate authorization flow" },
      { status: 500 }
    )
  }
}
