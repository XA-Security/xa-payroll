/**
 * QuickBooks Online OAuth and API Client utilities
 * Handles OAuth 2.0 flow, token management, encryption, and API requests
 * Uses official Intuit OAuth SDK for compliance and maintenance
 */

import crypto from "node:crypto"
import type { SupabaseClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'
import { invoiceLogger } from '@/lib/invoice-logger'

// Use require for CommonJS module to avoid TypeScript interop issues
const OAuthClient = require("intuit-oauth")

const QBO_API_BASE_URL = "https://quickbooks.api.intuit.com"
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""

/**
 * Get the redirect URI for QuickBooks OAuth (Accounting API)
 * Uses NEXT_PUBLIC_APP_URL for production/development environments
 * Falls back to localhost for local development
 */
export function getRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${appUrl}/api/quickbooks/auth/callback`
}

/**
 * Get the redirect URI for QuickBooks Payroll OAuth
 * Uses NEXT_PUBLIC_APP_URL for production/development environments
 * Falls back to localhost for local development
 * This is separate from the accounting redirect URI
 */
export function getPayrollRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${appUrl}/api/quickbooks/payroll/auth/callback`
}

/**
 * Create and configure the official Intuit OAuth client for Accounting API
 */
export function createOAuthClient() {
  return new OAuthClient({
    clientId: process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID || "",
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || "",
    environment: (process.env.QUICKBOOKS_ENVIRONMENT || "sandbox") as "sandbox" | "production",
    redirectUri: getRedirectUri(),
  })
}

/**
 * Create and configure the official Intuit OAuth client for Payroll API
 * Uses the payroll-specific redirect URI
 */
export function createPayrollOAuthClient() {
  return new OAuthClient({
    clientId: process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID || "",
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || "",
    environment: (process.env.QUICKBOOKS_ENVIRONMENT || "sandbox") as "sandbox" | "production",
    redirectUri: getPayrollRedirectUri(),
  })
}

/**
 * Generate QuickBooks OAuth authorization URL using official SDK
 * @param state - Optional state token for CSRF protection and user tracking
 */
export function generateAuthorizationUrl(state?: string): string {
  const oauthClient = createOAuthClient()
  const authorizationUri = oauthClient.authorizeUri({
    scope: [
      "com.intuit.quickbooks.accounting",
    ],
    state: state || crypto.randomBytes(16).toString("hex"),
  })
  return authorizationUri
}

/**
 * Generate QuickBooks OAuth authorization URL for Payroll API
 * Requests expanded scopes: employee.read and payroll.compensation.read
 * Uses payroll-specific redirect URI to ensure Intuit redirects to the correct callback endpoint
 * @param state - Optional state token for CSRF protection and user tracking
 */
export function generatePayrollAuthorizationUrl(state?: string): string {
  const oauthClient = createPayrollOAuthClient()
  const authorizationUri = oauthClient.authorizeUri({
    scope: [
      "com.intuit.quickbooks.accounting",
      "com.intuit.quickbooks.payment",
      "project-management.project",
      "indirect-tax.tax-calculation.quickbooks",
      "payroll.compensation.read",
      "app-foundations.custom-dimensions.read",
      "app-foundations.custom-field-definitions.read",
      "app-foundations.custom-field-definitions",
    ],
    state: state || crypto.randomBytes(16).toString("hex"),
  })
  return authorizationUri
}

/**
 * Encrypt sensitive data (tokens) using AES-256-GCM
 */
export function encryptToken(token: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable not set")
  }

  const iv = crypto.randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY, "base64")
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  let encrypted = cipher.update(token, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

/**
 * Decrypt sensitive data (tokens) using AES-256-GCM
 */
export function decryptToken(encryptedToken: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable not set")
  }

  const [iv, authTag, encrypted] = encryptedToken.split(":")

  const key = Buffer.from(ENCRYPTION_KEY, "base64")
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex")
  )

  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Exchange authorization code for access token using official SDK
 * @param callbackUrl - Full callback URL with code and state parameters (e.g., "http://localhost:3000/api/quickbooks/auth/callback?code=ABC&realmId=123&state=xyz")
 * The intuit-oauth SDK parses the URL to extract the authorization code
 */
export async function exchangeCodeForToken(callbackUrl: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  x_refresh_token_expires_in: number
  realms_available: Array<{ id: string; name: string }>
}> {
  const oauthClient = createOAuthClient()

  try {
    // The SDK expects the full callback URL and parses it internally to extract the code
    const authResponse = await oauthClient.createToken(callbackUrl)

    if (!authResponse.getJson()) {
      throw new Error("Failed to get token response")
    }

    const token = authResponse.getJson()

    // Extract realm ID from the URL
    const url = new URL(callbackUrl)
    const realmId = url.searchParams.get("realmId") || "unknown"

    return {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_in: token.expires_in,
      token_type: token.token_type || "Bearer",
      x_refresh_token_expires_in: token.x_refresh_token_expires_in || 8726400,
      realms_available: [{ id: realmId, name: "Primary" }],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to exchange code for token"
    throw new Error(`Failed to exchange code for token: ${errorMessage}`)
  }
}

/**
 * Exchange authorization code for access token using Payroll-specific OAuth client
 * Uses the payroll redirect URI to ensure Intuit token exchange succeeds
 * @param callbackUrl - Full callback URL with code and state parameters (e.g., "http://localhost:3000/api/quickbooks/payroll/auth/callback?code=ABC&realmId=123&state=xyz")
 * The intuit-oauth SDK parses the URL to extract the authorization code
 */
export async function exchangePayrollCodeForToken(callbackUrl: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  x_refresh_token_expires_in: number
  realms_available: Array<{ id: string; name: string }>
}> {
  const oauthClient = createPayrollOAuthClient()

  try {
    // The SDK expects the full callback URL and parses it internally to extract the code
    const authResponse = await oauthClient.createToken(callbackUrl)

    if (!authResponse.getJson()) {
      throw new Error("Failed to get token response")
    }

    const token = authResponse.getJson()

    // Extract realm ID from the URL
    const url = new URL(callbackUrl)
    const realmId = url.searchParams.get("realmId") || "unknown"

    return {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_in: token.expires_in,
      token_type: token.token_type || "Bearer",
      x_refresh_token_expires_in: token.x_refresh_token_expires_in || 8726400,
      realms_available: [{ id: realmId, name: "Primary" }],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to exchange code for token"
    throw new Error(`Failed to exchange payroll code for token: ${errorMessage}`)
  }
}

/**
 * Refresh an expired access token using manual HTTP implementation
 * (The official intuit-oauth SDK had issues with refresh, so we use direct API calls)
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  x_refresh_token_expires_in: number
}> {
  const oauthUrl = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
  const clientId = process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID || ""
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || ""

  try {
    console.log("[QBO Refresh] Starting token refresh", {
      clientIdStart: clientId.substring(0, 5),
      refreshTokenLength: refreshToken.length,
      refreshTokenStart: refreshToken.substring(0, 10),
      refreshTokenEnd: refreshToken.substring(refreshToken.length - 10),
    })

    // Create Basic Auth header
    const credentials = `${clientId}:${clientSecret}`
    const encodedCredentials = Buffer.from(credentials).toString("base64")

    const requestBody = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })

    console.log("[QBO Refresh] Sending POST request to QuickBooks OAuth endpoint")

    const response = await fetch(oauthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: requestBody.toString(),
    })

    console.log("[QBO Refresh] Response received", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error("[QBO Refresh] Token refresh failed with HTTP error", {
        status: response.status,
        statusText: response.statusText,
        response: responseText.substring(0, 200),
      })
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${responseText}`)
    }

    const data = JSON.parse(responseText)

    console.log("[QBO Refresh] Token refresh successful", {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    })

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type || "Bearer",
      x_refresh_token_expires_in: data.x_refresh_token_expires_in || 8726400,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : "No stack"

    console.error("[QBO Refresh] Token refresh failed", {
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name,
    })

    throw new Error(`Failed to refresh token: ${errorMessage}`)
  }
}

/**
 * Revoke a token (disconnect integration)
 * Note: The intuit-oauth SDK does not provide token revocation.
 * Tokens will expire naturally based on their expiration time.
 * Local cleanup of the integration record handles the disconnect.
 */
export async function revokeToken(_accessToken: string): Promise<void> {
  // Token revocation is not available through the intuit-oauth SDK
  // The token will expire naturally, and local cleanup is sufficient
  // for disconnecting the integration in our application
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  // Consider expired if less than 5 minutes until actual expiration
  const bufferTime = 5 * 60 * 1000
  return Date.now()> expiresAt.getTime() - bufferTime
}

/**
 * Calculate token expiration timestamp
 */
export function calculateExpirationTime(expiresInSeconds: number): Date {
  return new Date(Date.now()+ expiresInSeconds * 1000)
}

/**
 * Response wrapper that includes intuit_tid header
 */
export interface QBOResponse<T> {
  data: T
  intuitTid?: string
}

/**
 * Parse QuickBooks XML responses into JSON structure
 * Handles IntuitResponse wrappers and extracts entity data
 */
function parseQBOXmlResponse(xmlText: string): Record<string, unknown> {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      parseTagValue: true,
      allowBooleanAttributes: true,
      isArray: () => false,
    })

    const parsed = parser.parse(xmlText) as Record<string, unknown>

    // Handle IntuitResponse wrapper
    if (parsed.IntuitResponse) {
      const intuitResp = parsed.IntuitResponse as Record<string, unknown>

      // Extract the actual entity from the wrapper (Customer, Invoice, etc.)
      const customer = intuitResp.Customer
      const invoice = intuitResp.Invoice
      const queryResponse = intuitResp.QueryResponse
      const restResponse = intuitResp.RestResponse

      if (customer) {
        return { Customer: customer }
      }
      if (invoice) {
        return { Invoice: invoice }
      }
      if (queryResponse) {
        return { QueryResponse: queryResponse || {} }
      }
      if (restResponse) {
        return { RestResponse: restResponse }
      }

      // Empty IntuitResponse is a valid success
      return {}
    }

    // Handle direct responses without wrapper
    if (parsed.QueryResponse) {
      return { QueryResponse: parsed.QueryResponse }
    }
    if (parsed.RestResponse) {
      return { RestResponse: parsed.RestResponse }
    }

    // Return parsed XML as-is if no recognized structure
    return parsed
  } catch (error) {
    // If XML parsing fails, log warning and return empty
    console.warn('[QBO] XML parsing failed:', error instanceof Error ? error.message : 'Unknown error')
    return {}
  }
}

/**
 * Make an authenticated request to QuickBooks API
 * Captures intuit_tid from X-Intuit-TID response header for troubleshooting
 * Hybrid approach: Prefers JSON (via Accept header) but falls back to XML parsing
 */
export async function makeQBORequest(
  endpoint: string,
  accessToken: string,
  realmId: string,
  options: {
    method?: string
    body?: Record<string, unknown> | string
    contentType?: string
  } = {}
): Promise<QBOResponse<unknown>> {
  const url = `${QBO_API_BASE_URL}/v3/company/${realmId}${endpoint}`

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": options.contentType || "application/json",
      "Accept": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  })

  // Capture intuit_tid from response headers for debugging
  const intuitTid = response.headers.get("X-Intuit-TID") || response.headers.get("x-intuit-tid")
  const contentType = response.headers.get("content-type") || ""

  // Read response body as text first
  const responseText = await response.text()

  // Check if response is XML (fallback when QBO doesn't respect Accept: application/json)
  if (contentType.includes("xml") || responseText.trim().startsWith("<?xml")) {
    // Check for error faults first
    if (responseText.includes("<Fault>") || responseText.includes("<fault>")) {
      throw new Error(
        `QBO API returned XML error (${response.status}): ${responseText.substring(0, 200)}${responseText.length > 200 ? "..." : ""}${intuitTid ? ` [TID: ${intuitTid}]` : ""}`
      )
    }

    // Parse XML response using proper XML parser
    const parsedData = parseQBOXmlResponse(responseText)

    // If we successfully parsed the XML, return it
    if (Object.keys(parsedData).length > 0 || responseText.includes("<IntuitResponse") || responseText.includes("<QueryResponse>")) {
      return {
        data: parsedData,
        intuitTid: intuitTid || undefined,
      }
    }

    // Unknown XML format - log for debugging
    console.warn(`[QBO] Unknown XML format received (${response.status}):`, responseText.substring(0, 500))
    throw new Error(
      `QBO API returned unexpected XML format (${response.status}): ${responseText.substring(0, 200)}${responseText.length > 200 ? "..." : ""}${intuitTid ? ` [TID: ${intuitTid}]` : ""}`
    )
  }

  // Check HTTP status
  if (!response.ok) {
    throw new Error(
      `QBO API error (${response.status}): ${responseText}${intuitTid ? ` [TID: ${intuitTid}]` : ""}`
    )
  }

  // Parse JSON response
  let data
  try {
    data = JSON.parse(responseText)
  } catch {
    throw new Error(
      `Failed to parse QBO response as JSON: ${responseText.substring(0, 100)}...${intuitTid ? ` [TID: ${intuitTid}]` : ""}`
    )
  }

  return {
    data,
    intuitTid: intuitTid || undefined,
  }
}

/**
 * Query QuickBooks API using Query Language (JPQL)
 */
export async function queryQBO(
  query: string,
  accessToken: string,
  realmId: string
): Promise<{ QueryResponse: Record<string, unknown>; time: number; intuitTid?: string }> {
  // Use URLSearchParams to properly encode query parameters without double-encoding
  // This preserves SQL escaping (e.g., '' for apostrophes)
  const params = new URLSearchParams()
  params.append('query', query)
  const response = await makeQBORequest(
    `/query?${params.toString()}`,
    accessToken,
    realmId,
    { method: "GET" }
  )

  return {
    ...(response.data as { QueryResponse: Record<string, unknown>; time: number }),
    intuitTid: response.intuitTid,
  }
}

interface QBOCustomer {
  Id: string
  DisplayName: string
  FullyQualifiedName?: string
  GivenName?: string
  FamilyName?: string
  PrimaryEmailAddr?: { Address: string }
  PrimaryPhone?: { FreeFormNumber: string }
  BillAddr?: {
    Line1?: string
    Line2?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
    Country?: string
  }
  SyncToken?: string
}

/**
 * Search for a customer in QuickBooks by name
 * Per Intuit docs: Use backslash to escape apostrophes in query strings
 * https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api/data-queries
 */
export async function searchQBOCustomer(
  name: string,
  accessToken: string,
  realmId: string
): Promise<QBOCustomer | null> {
  // Escape apostrophes with backslash (QBO standard, not SQL double-quotes)
  const escapedName = name.replace(/'/g, "\\'")
  const query = `SELECT * FROM Customer WHERE DisplayName = '${escapedName}'`
  const result = await queryQBO(query, accessToken, realmId)
  const customers = (result.QueryResponse?.Customer as QBOCustomer[]) || []
  return customers.length > 0 ? customers[0] : null
}

/**
 * Validate if a customer exists in QuickBooks by ID
 */
export async function validateQBOCustomer(
  customerId: string,
  accessToken: string,
  realmId: string
): Promise<QBOCustomer | null> {
  try {
    const query = `SELECT * FROM Customer WHERE Id = '${customerId}'`
    const result = await queryQBO(query, accessToken, realmId)
    const customers = (result.QueryResponse?.Customer as QBOCustomer[]) || []
    return customers.length > 0 ? customers[0] : null
  } catch {
    // Return null if query fails (customer doesn't exist or error)
    return null
  }
}

/**
 * Fetch a customer from QuickBooks by ID
 * Retrieves the full customer record with all fields including SyncToken
 */
export async function fetchQBOCustomer(
  customerId: string,
  accessToken: string,
  realmId: string
): Promise<QBOCustomer> {
  const response = await makeQBORequest(
    `/customer/${customerId}`,
    accessToken,
    realmId,
    { method: 'GET' }
  )

  const customer = (response.data as QBOCustomerResponse)?.Customer
  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`)
  }

  return customer
}

interface QBOCustomerResponse {
  Customer?: QBOCustomer
  Id?: string
}

/**
 * Create a customer in QuickBooks
 */
export async function createQBOCustomer(
  customerData: {
    displayName: string
    givenName?: string
    familyName?: string
    email?: string
    phone?: string
    notes?: string | null
    billingAddress?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string
    }
    currencyCode?: string
  },
  accessToken: string,
  realmId: string
): Promise<QBOCustomerResponse & { intuitTid?: string }> {
  // Build address only if at least one field has a value
  let billAddr: Record<string, string> | undefined
  if (customerData.billingAddress) {
    const hasAddressData = Object.values(customerData.billingAddress).some(val => val)
    if (hasAddressData) {
      billAddr = {}
      // Only add address fields if they have truthy values (not null, undefined, or empty string)
      if (customerData.billingAddress.line1?.trim()) billAddr.Line1 = customerData.billingAddress.line1.trim()
      if (customerData.billingAddress.line2?.trim()) billAddr.Line2 = customerData.billingAddress.line2.trim()
      if (customerData.billingAddress.city?.trim()) billAddr.City = customerData.billingAddress.city.trim()
      // QBO uses CountrySubDivisionCode (not State) for province/state
      if (customerData.billingAddress.state?.trim()) billAddr.CountrySubDivisionCode = customerData.billingAddress.state.trim()
      if (customerData.billingAddress.postalCode?.trim()) billAddr.PostalCode = customerData.billingAddress.postalCode.trim()
      if (customerData.billingAddress.country?.trim()) billAddr.Country = customerData.billingAddress.country.trim()
    }
  }

  const body: Record<string, unknown> = {
    DisplayName: customerData.displayName.trim(),
    // FullyQualifiedName is required by QBO API for customer creation
    FullyQualifiedName: customerData.displayName.trim(),
    // Default to CAD currency (XA Security is Canadian), can be overridden per customer
    CurrencyRef: {
      value: customerData.currencyCode || "CAD"
    }
  }

  // Only add given name if it has a non-empty trimmed value
  if (customerData.givenName?.trim()) {
    body.GivenName = customerData.givenName.trim()
  }

  // Only add family name if it has a non-empty trimmed value
  if (customerData.familyName?.trim()) {
    body.FamilyName = customerData.familyName.trim()
  }

  // Only add email if it has a non-empty trimmed value
  if (customerData.email?.trim()) {
    body.PrimaryEmailAddr = { Address: customerData.email.trim() }
  }

  // Only add phone if it has a non-empty trimmed value
  // QBO's FreeFormNumber field has restrictions - remove leading + and format properly
  if (customerData.phone?.trim()) {
    let phoneFormatted = customerData.phone.trim()
    // Remove leading + if present, as QBO may not accept it in FreeFormNumber
    if (phoneFormatted.startsWith('+')) {
      phoneFormatted = phoneFormatted.substring(1)
    }
    body.PrimaryPhone = { FreeFormNumber: phoneFormatted }
  }

  // Only add address if it has data
  if (billAddr) {
    body.BillAddr = billAddr
  }

  // Add notes if present
  if (customerData.notes?.trim()) {
    body.Notes = customerData.notes.trim()
  }

  // Remove undefined and null fields from body and nested objects
  const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const cleaned: Record<string, unknown> = {}
    Object.keys(obj).forEach((key) => {
      const value = obj[key]
      if (value === undefined || value === null) {
        // Skip undefined/null values
        return
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively clean nested objects
        cleaned[key] = cleanObject(value as Record<string, unknown>)
      } else {
        cleaned[key] = value
      }
    })
    return cleaned
  }

  const cleanedBody = cleanObject(body)

  // Log the actual JSON being sent to QBO for debugging
  console.log("[QBO Customer] Sending to QBO:", JSON.stringify(cleanedBody, null, 2))

  const response = await makeQBORequest(
    "/customer",
    accessToken,
    realmId,
    { method: "POST", body: cleanedBody }
  )

  return {
    ...(response.data as QBOCustomerResponse),
    intuitTid: response.intuitTid,
  }
}

/**
 * Update a customer in QuickBooks
 */
export async function updateQBOCustomer(
  customerId: string,
  syncToken: string,
  customerData: Record<string, unknown>,
  accessToken: string,
  realmId: string
): Promise<QBOCustomerResponse & { intuitTid?: string }> {
  const body = {
    ...customerData,
    Id: customerId,
    SyncToken: syncToken,
  }

  const response = await makeQBORequest(
    "/customer",
    accessToken,
    realmId,
    { method: "POST", body }
  )

  return {
    ...(response.data as QBOCustomerResponse),
    intuitTid: response.intuitTid,
  }
}

interface QBOTaxCode {
  Id: string
  Name: string
  DisplayName?: string
  TaxCodeType?: string
  percentBased?: boolean
  RateValue?: number
}


/**
 * Get all available tax codes from QuickBooks
 * Used for determining valid tax codes for Canadian GST/HST
 */
export async function getQBOTaxCodes(
  accessToken: string,
  realmId: string
): Promise<QBOTaxCode[]> {
  try {
    const query = "SELECT * FROM TaxCode"
    const result = await queryQBO(query, accessToken, realmId)
    const taxCodes = (result.QueryResponse?.TaxCode as QBOTaxCode[]) || []
    return taxCodes
  } catch (error) {
    console.error("[QBO TaxCodes] Error fetching tax codes:", error)
    // Return empty array if query fails - will fallback to GST in sync
    return []
  }
}

interface QBOInvoice {
  Id: string
  DocNumber?: string
  TotalAmt?: number
  EmailStatus?: string
  SyncToken?: string
}

interface QBOInvoiceResponse {
  Invoice?: QBOInvoice
  Id?: string
}

/**
 * Create an invoice in QuickBooks
 */
export async function createQBOInvoice(
  invoiceData: {
    customerId: string
    docNumber?: string
    txnDate: string // YYYY-MM-DD
    dueDate?: string
    line: Array<{
      Amount: number
      DetailType: "SalesItemLineDetail" | "DescriptionOnly"
      Description?: string
      SalesItemLineDetail?: {
        ItemRef: { value: string; name?: string }
        Qty: number
        UnitPrice: number
        TaxCodeRef?: { value: string }
      }
      LineNum?: number
    }>
    customerMemo?: { value: string }
    privateNote?: string
    taxExemptionReasonId?: number
    CustomField?: Array<{
      DefinitionId: string
      Name?: string
      Type?: string
      StringValue?: string
    }>
    SalesTermRef?: { value: string; name?: string }
    LocationRef?: { value: string; name?: string }
    DepartmentRef?: { value: string; name?: string }
    BillEmail?: { Address: string }
  },
  accessToken: string,
  realmId: string
): Promise<QBOInvoiceResponse & { intuitTid?: string }> {
  const body = {
    CustomerRef: { value: invoiceData.customerId },
    DocNumber: invoiceData.docNumber,
    TxnDate: invoiceData.txnDate,
    DueDate: invoiceData.dueDate,
    Line: invoiceData.line,
    CustomerMemo: invoiceData.customerMemo,
    ...(invoiceData.privateNote && { PrivateNote: invoiceData.privateNote }),
    TaxExemptionReasonId: invoiceData.taxExemptionReasonId,
    ...(invoiceData.CustomField && { CustomField: invoiceData.CustomField }),
    ...(invoiceData.SalesTermRef && { SalesTermRef: invoiceData.SalesTermRef }),
    ...(invoiceData.LocationRef && { LocationRef: invoiceData.LocationRef }),
    ...(invoiceData.DepartmentRef && { DepartmentRef: invoiceData.DepartmentRef }),
    ...(invoiceData.BillEmail && { BillEmail: invoiceData.BillEmail }),
  }

  // Remove undefined fields recursively
  const cleanBody = JSON.parse(JSON.stringify(body))

  const response = await makeQBORequest(
    "/invoice",
    accessToken,
    realmId,
    { method: "POST", body: cleanBody }
  )

  return {
    ...(response.data as QBOInvoiceResponse),
    intuitTid: response.intuitTid,
  }
}

/**
 * Get an invoice from QuickBooks
 */
export async function getQBOInvoice(
  invoiceId: string,
  accessToken: string,
  realmId: string
): Promise<QBOInvoiceResponse & { intuitTid?: string }> {
  const response = await makeQBORequest(
    `/invoice/${invoiceId}`,
    accessToken,
    realmId,
    { method: "GET" }
  )

  return {
    ...(response.data as QBOInvoiceResponse),
    intuitTid: response.intuitTid,
  }
}

/**
 * Update an invoice in QuickBooks
 * Requires the current SyncToken for optimistic locking
 */
export async function updateQBOInvoice(
  invoiceId: string,
  syncToken: string,
  invoiceData: {
    customerId?: string
    docNumber?: string
    txnDate?: string // YYYY-MM-DD
    dueDate?: string
    line?: Array<{
      Amount: number
      DetailType: "SalesItemLineDetail" | "DescriptionOnly"
      Description?: string
      SalesItemLineDetail?: {
        ItemRef: { value: string; name?: string }
        Qty: number
        UnitPrice: number
        TaxCodeRef?: { value: string }
      }
      LineNum?: number
      Id?: string  // Existing line ID for updates
    }>
    customerMemo?: { value: string }
    privateNote?: string
    taxExemptionReasonId?: number
    CustomField?: Array<{
      DefinitionId: string
      Name?: string
      Type?: string
      StringValue?: string
    }>
    SalesTermRef?: { value: string; name?: string }
    LocationRef?: { value: string; name?: string }
    DepartmentRef?: { value: string; name?: string }
  },
  accessToken: string,
  realmId: string
): Promise<QBOInvoiceResponse & { intuitTid?: string }> {
  const body = {
    Id: invoiceId,
    SyncToken: syncToken,
    CustomerRef: invoiceData.customerId ? { value: invoiceData.customerId } : undefined,
    DocNumber: invoiceData.docNumber,
    TxnDate: invoiceData.txnDate,
    DueDate: invoiceData.dueDate,
    Line: invoiceData.line,
    CustomerMemo: invoiceData.customerMemo,
    ...(invoiceData.privateNote && { PrivateNote: invoiceData.privateNote }),
    TaxExemptionReasonId: invoiceData.taxExemptionReasonId,
    ...(invoiceData.CustomField && { CustomField: invoiceData.CustomField }),
    ...(invoiceData.SalesTermRef && { SalesTermRef: invoiceData.SalesTermRef }),
    ...(invoiceData.LocationRef && { LocationRef: invoiceData.LocationRef }),
    ...(invoiceData.DepartmentRef && { DepartmentRef: invoiceData.DepartmentRef }),
    sparse: true,  // Only update provided fields (sparse update)
  }

  // Remove undefined fields recursively
  const cleanBody = JSON.parse(JSON.stringify(body))

  const response = await makeQBORequest(
    "/invoice",
    accessToken,
    realmId,
    { method: "POST", body: cleanBody }
  )

  return {
    ...(response.data as QBOInvoiceResponse),
    intuitTid: response.intuitTid,
  }
}

/**
 * Void an invoice in QuickBooks (soft delete)
 * QuickBooks doesn't support true deletion of invoices, only voiding
 */
export async function voidQBOInvoice(
  invoiceId: string,
  syncToken: string,
  accessToken: string,
  realmId: string
): Promise<QBOInvoiceResponse & { intuitTid?: string }> {
  const body = {
    Id: invoiceId,
    SyncToken: syncToken,
    sparse: true,
  }

  const cleanBody = JSON.parse(JSON.stringify(body))

  const response = await makeQBORequest(
    "/invoice?operation=void",
    accessToken,
    realmId,
    { method: "POST", body: cleanBody }
  )

  return {
    ...(response.data as QBOInvoiceResponse),
    intuitTid: response.intuitTid,
  }
}

/**
 * Get the latest invoice DocNumber from QuickBooks
 * Queries the 10 newest invoices to find the highest DocNumber
 * Returns the next number to use for a new invoice
 */
/**
 * DEPRECATED: This function should NOT be used anymore.
 *
 * Invoice numbers are now IMMUTABLE after creation and sync to QuickBooks.
 * Use the locally assigned invoice_number as the DocNumber instead.
 *
 * Rationale: Calling this during save/sync operations caused duplicate invoices
 * by auto-incrementing the number before sending to QB, then trying to update it
 * again after sync completion.
 *
 * @deprecated Use invoice.invoice_number directly as the DocNumber
 */
export async function getLatestQBODocNumber(
  accessToken: string,
  realmId: string,
  lastSuccessfulDocNumber?: string,
  failedDocNumber?: string
): Promise<string> {
  try {
    // Query ONLY Invoice DocNumbers to determine the next available invoice number
    // Credit Memos and Sales Receipts use different numbering schemes and should not affect invoice numbering
    const query = "SELECT DocNumber FROM Invoice ORDER BY Id DESC MAXRESULTS 100"

    const result = await queryQBO(query, accessToken, realmId)

    // Collect all Invoice DocNumbers
    const invoices = (result.QueryResponse?.Invoice || []) as Array<{
      DocNumber?: string
    }>
    const invoiceDocNumbers: string[] = []

    for (const invoice of invoices) {
      if (invoice.DocNumber) {
        invoiceDocNumbers.push(invoice.DocNumber)
      }
    }

    if (invoiceDocNumbers.length === 0) {
      // No invoices exist, start at 1001
      return "1001"
    }

    // Build a set of existing Invoice DocNumbers for collision detection
    const existingDocNumbers = new Set<string>(invoiceDocNumbers)
    let maxNumber = 1000
    let prefixFormat = "" // Store the prefix to maintain format consistency

    // If a DocNumber just failed, use it as the starting point instead of lastSuccessfulDocNumber
    // This ensures we increment past the failed number
    const startingDocNumber = failedDocNumber || lastSuccessfulDocNumber
    if (startingDocNumber) {
      const numericMatches = startingDocNumber.match(/\d+/g)
      if (numericMatches && numericMatches.length > 0) {
        const num = Number.parseInt(numericMatches[numericMatches.length - 1], 10)
        maxNumber = num

        // Extract the prefix
        const lastNumIndex = startingDocNumber.lastIndexOf(String(num))
        if (lastNumIndex > 0) {
          prefixFormat = startingDocNumber.substring(0, lastNumIndex)
        } else {
          prefixFormat = ""
        }
      }
    } else {
      // Fall back to scanning all invoices only if we don't have a stored value
      for (const docNumber of invoiceDocNumbers) {
        // Extract the last numeric sequence
        // For "2-32777", captures prefix="2-" and num="32777"
        // For "32777", captures prefix="" and num="32777"
        // IMPORTANT: Use non-greedy (.*?) to match up to the LAST digit sequence
        const match = docNumber.match(/^(.*?)(\d+)$/)
        if (match) {
          const extractedPrefix = match[1]
          const num = Number.parseInt(match[2], 10)
          if (num > maxNumber) {
            maxNumber = num
            prefixFormat = extractedPrefix
          }
        }
      }

      // Step 2: Anomaly detection for cold-start (no startingDocNumber)
      // Find the most common digit length among scanned numbers to detect outliers
      const parsedNums = invoiceDocNumbers
        .map(d => d.match(/^(.*?)(\d+)$/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map(m => m[2].length)

      if (parsedNums.length > 0) {
        const lengthFreq: Record<number, number> = {}
        for (const len of parsedNums) lengthFreq[len] = (lengthFreq[len] || 0) + 1

        const modeLength = Number(
          Object.keys(lengthFreq).sort((a, b) => lengthFreq[Number(b)] - lengthFreq[Number(a)])[0]
        )

        // If maxNumber has more digits than the mode, it's likely an outlier
        if (String(maxNumber).length > modeLength) {
          console.warn('[DOCNUMBER] QBO max has more digits than mode — possible anomaly', {
            qboMax: `${prefixFormat}${maxNumber}`,
            modeDigitLength: modeLength,
            action: 'Re-scanning with only mode-length numbers',
          })

          // Re-scan with only mode-length numbers
          maxNumber = 1000
          prefixFormat = ''
          for (const docNumber of invoiceDocNumbers) {
            const m = docNumber.match(/^(.*?)(\d+)$/)
            if (m && m[2].length === modeLength) {
              const n = Number.parseInt(m[2], 10)
              if (n > maxNumber) {
                maxNumber = n
                prefixFormat = m[1]
              }
            }
          }
        }
      }
    }

    // Step 2b: Digit-length preservation when startingDocNumber is provided
    // Verify that QBO's max number doesn't exceed the natural digit expansion
    if (startingDocNumber) {
      const refMatch = startingDocNumber.match(/^(.*?)(\d+)$/)
      if (refMatch) {
        const refNum = Number.parseInt(refMatch[2], 10)
        const naturalNext = refNum + 1
        const naturalNextDigits = String(naturalNext).length
        const maxDigits = String(maxNumber).length

        if (maxDigits > naturalNextDigits && maxNumber > refNum) {
          // Anomaly: QBO has a number with more digits than expected
          console.warn('[DOCNUMBER] Anomalous QBO invoice number detected', {
            localMax: startingDocNumber,
            qboMax: `${prefixFormat}${maxNumber}`,
            expected: `${refMatch[1]}${naturalNext}`,
            action: 'Capping to local max to preserve digit length',
          })
          // Cap back to local reference to prevent digit-length corruption
          maxNumber = refNum
          prefixFormat = refMatch[1]
        }
      }
    }

    // Find an available DocNumber, auto-incrementing upward if collision detected
    let candidateNumber = `${prefixFormat}${maxNumber + 1}`
    let increment = 0
    const MAX_COLLISION_ATTEMPTS = 100

    while (existingDocNumbers.has(candidateNumber) && increment < MAX_COLLISION_ATTEMPTS) {
      increment++
      candidateNumber = `${prefixFormat}${maxNumber + 1 + increment}`
    }

    if (existingDocNumbers.has(candidateNumber)) {
      // Collision prevention exhausted - use timestamp-based fallback
      return `INV-${Date.now()}`
    }

    return candidateNumber
  } catch (error) {
    console.warn("Failed to get latest QBO DocNumber, using default:", error)
    // Return a timestamp-based fallback DocNumber
    return `INV-${Date.now()}`
  }
}

/**
 * Get next available DocNumber when a collision is detected during invoice sync
 *
 * Workflow:
 * 1. On DocNumber collision, call this function with the failed DocNumber
 * 2. Queries QBO to get the latest invoices
 * 3. Auto-increments past all existing numbers to find an available one
 * 4. Returns the first available DocNumber
 *
 * This ensures we never get another collision and always find a working number
 */
export async function getNextAvailableDocNumberOnCollision(
  failedDocNumber: string,
  accessToken: string,
  realmId: string
): Promise<string> {
  try {
    invoiceLogger.debug("QBO-DOCNUMBER", "Collision detected, fetching latest QBO DocNumber to find available number", {
      failedDocNumber,
    })

    // Use getLatestQBODocNumber with the failed number as the starting point
    // It will query QBO and auto-increment past all collisions
    const nextNumber = await getLatestQBODocNumber(
      accessToken,
      realmId,
      undefined, // No lastSuccessfulDocNumber
      failedDocNumber // Use failed number as starting point
    )

    invoiceLogger.debug("QBO-DOCNUMBER", "Next available DocNumber determined", {
      failedDocNumber,
      nextAvailableNumber: nextNumber,
    })

    return nextNumber
  } catch (error) {
    invoiceLogger.warn("QBO-DOCNUMBER", "Failed to get next available DocNumber on collision, using fallback", {
      failedDocNumber,
      error: error instanceof Error ? error.message : String(error),
    })
    // Fallback to timestamp-based number
    return `INV-${Date.now()}`
  }
}

interface QBOPayment {
  Id: string
  DocNumber?: string
  TotalAmt?: number
  TxnDate?: string
  Line?: Array<{
    LinkedTxn?: Array<{ txnId: string }>
  }>
}

/**
 * Search for payments in QuickBooks
 */
export async function searchQBOPayments(
  customerId: string,
  accessToken: string,
  realmId: string,
  limit = 100
): Promise<QBOPayment[]> {
  const query = `SELECT * FROM Payment WHERE CustomerRef = '${customerId}' MAXRESULTS ${limit}`
  const result = await queryQBO(query, accessToken, realmId)
  return (result.QueryResponse?.Payment || []) as QBOPayment[]
}

interface QBOAccount {
  Id: string
  Name: string
  Active?: boolean
  AccountType?: string
}

/**
 * Get accounts from QuickBooks (for invoice item mapping)
 */
export async function getQBOAccounts(
  accessToken: string,
  realmId: string
): Promise<QBOAccount[]> {
  const query = "SELECT * FROM Account WHERE Active = true"
  const result = await queryQBO(query, accessToken, realmId)
  return (result.QueryResponse?.Account || []) as QBOAccount[]
}

export interface QBOIntegrationConfig {
  accessToken: string
  refreshToken: string
  realmId: string
  expiresAt: Date
}

export interface QBOSyncResult {
  success: boolean
  externalId?: string
  error?: string
  details?: Record<string, unknown>
}

interface QBOAttachable {
  Id: string
  FileName?: string
  FileAccessUri?: string
}

interface QBOAttachableResponse {
  Attachable?: QBOAttachable
  Id?: string
}

/**
 * Upload a PDF file as an attachment to a QuickBooks invoice
 * Uses the Attachable API to attach the PDF to the invoice
 * @param invoiceId - QuickBooks Invoice ID
 * @param pdfUrl - Public URL to the PDF file (must be publicly accessible)
 * @param accessToken - Valid QuickBooks access token
 * @param realmId - QuickBooks Realm ID
 * @returns Attachable ID if successful, or null if no URL or upload failed
 */
export async function uploadQBOAttachment(
  invoiceId: string,
  pdfUrl: string | null | undefined,
  accessToken: string,
  realmId: string,
  invoiceNumber?: string,
  invoiceDate?: string,
  entityType: string = 'Invoice'
): Promise<string | null> {
  // Return early if no PDF URL
  if (!pdfUrl || typeof pdfUrl !== 'string') {
    return null
  }
  try {
    // Fetch the PDF from the URL
    console.log('[QBO Attachment] Fetching PDF from URL:', `${pdfUrl.substring(0, 50)}...`)
    const pdfResponse = await fetch(pdfUrl)

    if (!pdfResponse.ok) {
      console.error('[QBO Attachment] Failed to fetch PDF:', {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
      })
      return null
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Generate filename with invoice number and date
    // Format: Invoice-[DOCNUMBER]-[MMM-DD-YYYY].pdf
    let filename: string
    if (invoiceNumber) {
      if (invoiceDate) {
        // Parse ISO date (YYYY-MM-DD) and format as MMM-DD-YYYY
        const date = new Date(invoiceDate)
        const monthAbbr = date.toLocaleString('en-US', { month: 'short' })
        const day = String(date.getDate()).padStart(2, '0')
        const year = date.getFullYear()
        filename = `Invoice-${invoiceNumber}-${monthAbbr}-${day}-${year}.pdf`
      } else {
        filename = `Invoice-${invoiceNumber}.pdf`
      }
    } else {
      filename = `invoice-${invoiceId}.pdf`
    }

    console.log('[QBO Attachment] Uploading PDF to QuickBooks via /upload endpoint:', {
      invoiceId,
      filename,
      sizeBytes: pdfBuffer.byteLength,
    })

    // Create multipart/form-data with proper boundary
    const boundary = `----FormBoundary${Date.now()}${Math.random().toString(36).substr(2, 9)}`

    // Part 1: Metadata JSON
    const metadata = {
      AttachableRef: [
        {
          EntityRef: {
            type: entityType,
            value: invoiceId,
          },
        },
      ],
      FileName: filename,
      ContentType: 'application/pdf',
    }

    // Build multipart body
    const parts: string[] = []

    // Add metadata part
    parts.push(`--${boundary}`)
    parts.push('Content-Disposition: form-data; name="file_metadata_01"')
    parts.push('Content-Type: application/json')
    parts.push('')
    parts.push(JSON.stringify(metadata))

    // Add file part header
    parts.push(`--${boundary}`)
    parts.push(`Content-Disposition: form-data; name="file_content_01"; filename="${filename}"`)
    parts.push('Content-Type: application/pdf')
    parts.push('')

    // Convert parts to Uint8Array
    const encoder = new TextEncoder()
    const textPart = `${parts.join('\r\n')}\r\n`
    const textBytes = encoder.encode(textPart)

    // Combine text part with binary PDF data
    const combined = new Uint8Array(textBytes.length + pdfBuffer.byteLength + encoder.encode(`\r\n--${boundary}--\r\n`).length)
    combined.set(new Uint8Array(textBytes), 0)
    combined.set(new Uint8Array(pdfBuffer), textBytes.length)
    combined.set(new Uint8Array(encoder.encode(`\r\n--${boundary}--\r\n`)), textBytes.length + pdfBuffer.byteLength)

    // Make the multipart request directly to QBO API
    const qboUrl = `https://quickbooks.api.intuit.com/v3/company/${realmId}/upload`

    const uploadResponse = await fetch(qboUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: combined,
    })

    // Get response as text first to handle both JSON and XML responses
    const responseText = await uploadResponse.text()

    // Check if response is XML
    if (responseText.trim().startsWith('<?xml')) {
      // Parse XML response
      // Check if it's an error response (contains <Fault> element)
      if (responseText.includes('<Fault')) {
        console.error('[QBO Attachment] QuickBooks returned XML fault response:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: responseText.substring(0, 500),
        })
        return null
      }

      // It's a success response - extract Attachable ID from XML
      // Look for <Id> element within <Attachable>
      const idMatch = responseText.match(/<Attachable[^>]*>[\s\S]*?<Id>(\d+)<\/Id>/)
      if (idMatch?.[1]) {
        const attachableId = idMatch[1]
        console.log('[QBO Attachment] PDF successfully attached to invoice:', {
          invoiceId,
          attachableId,
          filename,
        })
        return attachableId
      }
        console.warn('[QBO Attachment] Could not extract attachment ID from XML response:', {
          responsePreview: responseText.substring(0, 300),
        })
        return null
    }

    // Check HTTP status
    if (!uploadResponse.ok) {
      console.error('[QBO Attachment] Upload endpoint returned error:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: responseText.substring(0, 500),
      })
      return null
    }

    // Parse JSON response
    let uploadData: QBOAttachableResponse
    try {
      uploadData = JSON.parse(responseText) as QBOAttachableResponse
    } catch (parseError) {
      console.error('[QBO Attachment] Failed to parse response as JSON:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: responseText.substring(0, 200),
      })
      return null
    }

    const attachableId = uploadData.Attachable?.Id || uploadData.Id

    if (attachableId) {
      console.log('[QBO Attachment] PDF successfully attached to invoice:', {
        invoiceId,
        attachableId,
        filename,
      })
      return attachableId
    }
      console.warn('[QBO Attachment] No attachment ID returned from QuickBooks')
      return null
  } catch (error) {
    console.error('[QBO Attachment] Failed to upload PDF attachment:', {
      invoiceId,
      error: error instanceof Error ? error.message : String(error),
    })
    // Return null instead of throwing - attachment upload is non-blocking
    return null
  }
}

/**
 * Make an authenticated request to QuickBooks Payroll GraphQL API
 * @param query - GraphQL query string
 * @param variables - Optional GraphQL variables
 * @param accessToken - Valid access token with payroll scopes
 * @returns GraphQL response with data and optional errors
 */
export async function makeQBOGraphQLRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  accessToken?: string
): Promise<{ data: T | null; errors?: Array<{ message: string }> }> {
  const url = "https://qb.api.intuit.com/graphql"

  if (!accessToken) {
    throw new Error("Access token required for GraphQL request")
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error("[QBO GraphQL] Request failed:", {
        status: response.status,
        statusText: response.statusText,
        response: responseText.substring(0, 500),
      })
      throw new Error(`GraphQL request failed (${response.status}): ${responseText}`)
    }

    const data = JSON.parse(responseText)
    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[QBO GraphQL] Error:", errorMessage)
    throw error
  }
}

/**
 * Get a valid, non-expired access token for QuickBooks API calls
 * Automatically refreshes token if expired or expiring soon
 * @param supabase - Supabase client for database access
 * @param integrationId - Integration record ID
 * @returns Valid access token and realm ID, or throws if integration not found
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  integrationId: string,
  integrationType: string = 'quickbooks'
): Promise<{ accessToken: string; realmId: string }> {
  // Fetch the integration record
  const { data: integration, error: fetchError } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('integration_type', integrationType)
    .single()

  if (fetchError || !integration) {
    const errorMsg = `QuickBooks integration not found: ${fetchError?.message || 'Unknown error'}`
    console.error('[QBO Token] Fetch error:', errorMsg)
    throw new Error(errorMsg)
  }

  if (!integration.is_active) {
    console.error('[QBO Token] Integration is inactive')
    throw new Error('QuickBooks integration is not active')
  }

  const tokenExpiresAt = new Date(integration.token_expires_at)
  const realmId = integration.settings?.realm_id
  const environment = integration.settings?.environment || 'unknown'

  if (!realmId) {
    console.error('[QBO Token] Missing Realm ID in settings', {
      integrationId,
      settings: integration.settings,
    })
    throw new Error('Missing QuickBooks Realm ID in integration settings')
  }

  console.debug('[QBO Token] Configuration loaded', {
    integrationId,
    realmId,
    environment,
    tokenExpiresAt: tokenExpiresAt.toISOString(),
    nowTime: new Date().toISOString(),
    isExpired: isTokenExpired(tokenExpiresAt),
  })

  // Check if token is expired or expiring soon (5-minute buffer)
  if (isTokenExpired(tokenExpiresAt)) {
    console.log('[QBO Token Refresh] Token expired or expiring soon, refreshing...', {
      integrationId,
      expiresAt: tokenExpiresAt.toISOString(),
      now: new Date().toISOString(),
      realmId,
      environment,
    })

    try {
      // Decrypt the refresh token
      console.debug('[QBO Token Refresh] Decrypting refresh token...')
      const decryptedRefreshToken = decryptToken(integration.refresh_token)
      console.debug('[QBO Token Refresh] Refresh token decrypted successfully')

      // Get new tokens from QuickBooks
      console.log('[QBO Token Refresh] Calling QuickBooks OAuth endpoint to refresh token...')
      const newTokens = await refreshAccessToken(decryptedRefreshToken)
      const newExpiresAt = calculateExpirationTime(newTokens.expires_in)

      // Encrypt new tokens
      console.debug('[QBO Token Refresh] Encrypting new tokens...')
      const encryptedAccessToken = encryptToken(newTokens.access_token)
      const encryptedRefreshToken = encryptToken(newTokens.refresh_token)
      console.debug('[QBO Token Refresh] New tokens encrypted successfully')

      // Update database with new tokens using RPC function with row locking
      // This prevents race conditions when multiple API calls try to refresh simultaneously
      console.log('[QBO Token Refresh] Updating database with new tokens using lock...', {
        newExpiresAt: newExpiresAt.toISOString(),
      })
      const { data: refreshResult, error: rpcError } = await supabase.rpc(
        'refresh_integration_token',
        {
          p_integration_id: integrationId,
          p_new_access_token: encryptedAccessToken,
          p_new_refresh_token: encryptedRefreshToken,
          p_new_expires_at: newExpiresAt.toISOString(),
        }
      )

      if (rpcError) {
        console.error('[QBO Token Refresh] RPC call failed:', rpcError)
        throw new Error(`Failed to update tokens: ${rpcError.message}`)
      }

      if (!refreshResult || refreshResult.length === 0) {
        console.error('[QBO Token Refresh] RPC returned no result')
        throw new Error('Token refresh RPC returned empty result')
      }

      const result = refreshResult[0]

      if (result.locked_by_another_process) {
        // Another process is/was refreshing the token
        console.log('[QBO Token Refresh] Another process refreshed the token, fetching updated version...')

        // Refetch to get the updated token
        const { data: updatedIntegration, error: refetchError } = await supabase
          .from('integrations')
          .select('access_token, settings')
          .eq('id', integrationId)
          .single()

        if (refetchError || !updatedIntegration) {
          console.error('[QBO Token Refresh] Failed to refetch updated integration:', refetchError)
          throw new Error(`Failed to refetch updated integration: ${refetchError?.message}`)
        }

        console.log('[QBO Token Refresh] Using token refreshed by other process', {
          integrationId,
          realmId,
          environment,
        })

        return {
          accessToken: decryptToken(updatedIntegration.access_token),
          realmId: updatedIntegration.settings?.realm_id,
        }
      }

      console.log('[QBO Token Refresh] Token refreshed successfully', {
        integrationId,
        newExpiresAt: newExpiresAt.toISOString(),
        realmId,
        environment,
        wasLocked: result.locked_by_another_process,
      })

      return {
        accessToken: newTokens.access_token,
        realmId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[QBO Token Refresh] Failed to refresh token:', errorMessage)

      // Check if this is an invalid refresh token error (token has expired or is invalid)
      const isInvalidRefreshToken =
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('refresh token') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('incorrect token') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.toLowerCase().includes('unauthorized')

      if (isInvalidRefreshToken) {
        console.warn('[QBO Token Refresh] Refresh token is invalid, initiating automatic reauthorization')

        // Mark integration as needing reauth
        const { error: markReauthError } = await supabase
          .from('integrations')
          .update({
            needs_reauth: true,
            last_auth_error: errorMessage,
            sync_status: 'error',
            error_message: 'QuickBooks authorization expired. Please reconnect.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', integrationId)

        if (markReauthError) {
          console.error('[QBO Token Refresh] Failed to mark integration for reauth:', markReauthError)
        }

        // Throw error with special marker so caller can trigger reauth
        const error = new Error(`Failed to refresh QuickBooks token: ${errorMessage}`)
        ;(error as any).requiresReauthorization = true
        ;(error as any).integrationId = integrationId
        throw error
      }

      throw new Error(`Failed to refresh QuickBooks token: ${errorMessage}`)
    }
  }

  // Token is still valid, decrypt and return it
  console.debug('[QBO Token] Token is still valid, decrypting existing token...', {
    expiresAt: tokenExpiresAt.toISOString(),
    realmId,
  })
  const decryptedAccessToken = decryptToken(integration.access_token)
  console.debug('[QBO Token] Existing token decrypted successfully', { realmId })
  return {
    accessToken: decryptedAccessToken,
    realmId,
  }
}

/**
 * Fetch custom field definitions from QuickBooks
 * Returns available custom fields and their DefinitionIds
 * Used for configuring custom field mappings
 */
export async function fetchQBOCustomFieldDefinitions(
  accessToken: string,
  realmId: string
): Promise<Array<{
  id: string;
  name: string;
  type: string;
  entityType: string;
}>> {
  try {
    console.log('[QBO Custom Fields] Querying invoices to discover custom field definitions')

    // Query recent invoices to discover custom fields
    // Custom field definitions are embedded in the CustomField array of each invoice
    const invoicesQuery = 'SELECT * FROM Invoice MAXRESULTS 50'
    const invoicesResult = await queryQBO(invoicesQuery, accessToken, realmId)

    if (!invoicesResult?.QueryResponse?.Invoice) {
      console.log('[QBO Custom Fields] No invoices found, returning empty array')
      return []
    }

    // Parse invoices and extract unique custom field definitions
    const invoicesArray = invoicesResult.QueryResponse.Invoice as Record<string, unknown>[]
    if (!invoicesArray || invoicesArray.length === 0) {
      console.log('[QBO Custom Fields] Invoices array is empty, returning empty array')
      return []
    }

    // Use a map to track unique custom fields by DefinitionId
    const customFieldsMap = new Map<string, {
      id: string;
      name: string;
      type: string;
      entityType: string;
    }>()

    // Process each invoice to extract unique custom fields
    invoicesArray.forEach((invoice: Record<string, unknown>) => {
      const customFieldArray = invoice.CustomField as Record<string, unknown>[] | undefined
      if (customFieldArray && Array.isArray(customFieldArray)) {
        customFieldArray.forEach((field: Record<string, unknown>) => {
          const definitionId = field.DefinitionId as string | undefined
          const name = field.Name as string | undefined
          const type = field.Type as string | undefined

          if (definitionId && name) {
            // Only add if we haven't seen this DefinitionId before
            if (!customFieldsMap.has(definitionId)) {
              customFieldsMap.set(definitionId, {
                id: definitionId,
                name: name,
                type: type || 'StringType',
                entityType: 'Invoice'
              })
            }
          }
        })
      }
    })

    const customFields = Array.from(customFieldsMap.values())

    console.log('[QBO Custom Fields] Found custom field definitions by sampling invoices:', {
      count: customFields.length,
      invoicesSampled: invoicesArray.length,
      fields: customFields.map(f => ({ id: f.id, name: f.name }))
    })

    return customFields
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[QBO Custom Fields] Failed to fetch custom field definitions:', errorMessage)
    throw error
  }
}

/**
 * Fetch available payment terms from QuickBooks
 * Returns a list of terms with their QBO IDs
 * Used for mapping Digital XA terms to QBO Term IDs
 */
export async function fetchQBOPaymentTerms(
  accessToken: string,
  realmId: string
): Promise<Array<{
  id: string;
  name: string;
}>> {
  try {
    const query = "SELECT * FROM Term"
    const result = await queryQBO(query, accessToken, realmId)
    const terms = (result.QueryResponse?.Term as Array<{ Id: string; Name: string }>) || []
    return terms.map(term => ({ id: term.Id, name: term.Name }))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[QBO Payment Terms] Failed to fetch payment terms:', errorMessage)
    throw error
  }
}

/**
 * Fetch all available Departments from QuickBooks (displayed as "Locations")
 * Used for mapping Digital XA locations to QBO Department IDs
 */
export async function fetchLocations(
  accessToken: string,
  realmId: string
): Promise<Array<{ id: string; name: string }>> {
  try {
    const query = "SELECT * FROM Department"
    const result = await queryQBO(query, accessToken, realmId)
    const departments = (result.QueryResponse?.Department as Array<{ Id: string; Name: string }>) || []
    return departments.map(department => ({ id: department.Id, name: department.Name }))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[QBO Locations] Failed to fetch locations:', errorMessage)
    throw error
  }
}

/**
 * Delete a customer from QuickBooks
 * Note: QBO doesn't support hard delete for customers with transactions.
 * In such cases, the customer should be marked as inactive instead.
 * @param customerId - The QBO customer ID to delete
 * @param accessToken - Valid QBO access token
 * @param realmId - QBO Realm ID (company ID)
 */
export async function deleteQBOCustomer(
  customerId: string,
  accessToken: string,
  realmId: string
): Promise<{ success: boolean; error?: string; requiresInactive?: boolean }> {
  try {
    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/customer/${customerId}?operation=delete`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData?.fault?.error?.[0]?.message || `HTTP ${response.status}`

      // Check if error is due to customer having transactions
      if (
        response.status === 400 &&
        errorMessage?.toLowerCase().includes('transaction')
      ) {
        console.warn(`[QBO Delete] Customer ${customerId} has transactions - recommend marking inactive instead`)
        return { success: false, error: errorMessage, requiresInactive: true }
      }

      console.error(`[QBO Delete] Failed to delete customer ${customerId}:`, errorMessage)
      return { success: false, error: errorMessage }
    }

    console.log(`[QBO Delete] Successfully deleted customer ${customerId}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("[QBO Delete] Error deleting customer:", error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Mark a customer as inactive in QuickBooks (soft delete alternative)
 * Use this when customer has transactions and cannot be hard-deleted
 * @param customerId - The QBO customer ID to mark inactive
 * @param syncToken - Current sync token for optimistic locking
 * @param accessToken - Valid QBO access token
 * @param realmId - QBO Realm ID (company ID)
 */
export async function markQBOCustomerInactive(
  customerId: string,
  syncToken: string,
  accessToken: string,
  realmId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch current customer data
    const customer = await fetchQBOCustomer(customerId, accessToken, realmId)

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    // Update customer with Active=false
    const updatePayload = {
      ...customer,
      Active: false,
      SyncToken: syncToken,
    }

    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/customer`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData?.fault?.error?.[0]?.message || `HTTP ${response.status}`
      console.error(`[QBO Inactive] Failed to mark customer ${customerId} inactive:`, errorMessage)
      return { success: false, error: errorMessage }
    }

    console.log(`[QBO Inactive] Successfully marked customer ${customerId} as inactive`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("[QBO Inactive] Error marking customer inactive:", error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Search for customers in QuickBooks by name
 * @param searchTerm - The search term to find customers
 * @param accessToken - Valid QBO access token
 * @param realmId - QBO Realm ID (company ID)
 * @param limit - Maximum number of results to return
 * @returns Array of matching customers
 */
export async function searchQBOCustomers(
  searchTerm: string,
  accessToken: string,
  realmId: string,
  limit = 10
): Promise<QBOCustomer[]> {
  try {
    // Use QB's QueryAPI to search for customers by name
    // QB LIKE operator supports wildcard searching
    const escapedTerm = searchTerm.replace(/'/g, "\\'")
    const query = `SELECT * FROM Customer WHERE DisplayName LIKE '%${escapedTerm}%' OR Name LIKE '%${escapedTerm}%' MAXRESULTS ${limit}`
    const result = await queryQBO(query, accessToken, realmId)
    const customers = (result.QueryResponse?.Customer as QBOCustomer[]) || []
    return customers
  } catch (error) {
    console.error('[QBO Customer Search] Error searching customers:', error)
    return []
  }
}

/**
 * QBO Estimate types for sync functionality
 */
interface QBOEstimate {
  Id: string
  DocNumber?: string
  TotalAmt?: number
  TxnStatus?: string
  SyncToken?: string
}

interface QBOEstimateResponse {
  Estimate?: QBOEstimate
  Id?: string
}

/**
 * Create an estimate in QuickBooks
 */
export async function createQBOEstimate(
  estimateData: {
    customerId: string
    docNumber?: string
    txnDate: string // YYYY-MM-DD
    expirationDate?: string
    txnStatus?: 'Pending' | 'Accepted' | 'Closed'
    line: Array<{
      Amount: number
      DetailType: "SalesItemLineDetail" | "DescriptionOnly"
      Description?: string
      SalesItemLineDetail?: {
        ItemRef: { value: string; name?: string }
        Qty: number
        UnitPrice: number
        TaxCodeRef?: { value: string }
      }
      LineNum?: number
    }>
    customerMemo?: { value: string }
    BillEmail?: { Address: string }
  },
  accessToken: string,
  realmId: string
): Promise<QBOEstimateResponse & { intuitTid?: string }> {
  const body = {
    CustomerRef: { value: estimateData.customerId },
    DocNumber: estimateData.docNumber,
    TxnDate: estimateData.txnDate,
    ExpirationDate: estimateData.expirationDate,
    TxnStatus: estimateData.txnStatus,
    Line: estimateData.line,
    CustomerMemo: estimateData.customerMemo,
    ...(estimateData.BillEmail && { BillEmail: estimateData.BillEmail }),
  }

  // Remove undefined fields recursively
  const cleanBody = JSON.parse(JSON.stringify(body))

  const response = await makeQBORequest(
    "/estimate",
    accessToken,
    realmId,
    { method: "POST", body: cleanBody }
  )

  return {
    ...(response.data as QBOEstimateResponse),
    intuitTid: response.intuitTid,
  }
}

/**
 * Get an estimate from QuickBooks
 */
export async function getQBOEstimate(
  estimateId: string,
  accessToken: string,
  realmId: string
): Promise<QBOEstimateResponse & { intuitTid?: string }> {
  const response = await makeQBORequest(
    `/estimate/${estimateId}`,
    accessToken,
    realmId,
    { method: "GET" }
  )

  return {
    ...(response.data as QBOEstimateResponse),
    intuitTid: response.intuitTid,
  }
}

/**
 * Update an estimate in QuickBooks
 * Requires the current SyncToken for optimistic locking
 */
export async function updateQBOEstimate(
  estimateId: string,
  syncToken: string,
  estimateData: {
    customerId?: string
    docNumber?: string
    txnDate?: string // YYYY-MM-DD
    expirationDate?: string
    txnStatus?: 'Pending' | 'Accepted' | 'Closed'
    line?: Array<{
      Amount: number
      DetailType: "SalesItemLineDetail" | "DescriptionOnly"
      Description?: string
      SalesItemLineDetail?: {
        ItemRef: { value: string; name?: string }
        Qty: number
        UnitPrice: number
        TaxCodeRef?: { value: string }
      }
      LineNum?: number
    }>
    customerMemo?: { value: string }
    BillEmail?: { Address: string }
  },
  accessToken: string,
  realmId: string
): Promise<QBOEstimateResponse & { intuitTid?: string }> {
  const body = {
    SyncToken: syncToken,
    ...(estimateData.customerId && { CustomerRef: { value: estimateData.customerId } }),
    ...(estimateData.docNumber !== undefined && { DocNumber: estimateData.docNumber }),
    ...(estimateData.txnDate && { TxnDate: estimateData.txnDate }),
    ...(estimateData.expirationDate !== undefined && { ExpirationDate: estimateData.expirationDate }),
    ...(estimateData.txnStatus && { TxnStatus: estimateData.txnStatus }),
    ...(estimateData.line && { Line: estimateData.line }),
    ...(estimateData.customerMemo && { CustomerMemo: estimateData.customerMemo }),
    ...(estimateData.BillEmail && { BillEmail: estimateData.BillEmail }),
  }

  // Remove undefined fields recursively
  const cleanBody = JSON.parse(JSON.stringify(body))

  const response = await makeQBORequest(
    `/estimate/${estimateId}`,
    accessToken,
    realmId,
    { method: "POST", body: cleanBody }
  )

  return {
    ...(response.data as QBOEstimateResponse),
    intuitTid: response.intuitTid,
  }
}
