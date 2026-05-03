import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'
import { getValidAccessToken, queryQBO, makeQBORequest } from '@/lib/quickbooks-client'
import { getHumanityAccessToken, fetchEmployeeByEid } from '@/lib/humanity'

/**
 * Sanitize address line for QBO (41 char limit, no special chars)
 */
function sanitizeAddressLine(line: string | undefined): string {
  if (!line) return ''
  // Remove special characters but keep letters, numbers, dash, dot, comma, hash
  const sanitized = line
    .replace(/[^\w\s\-.,#]/g, '')
    .trim()
  // Truncate to 41 chars (QBO limit)
  return sanitized.substring(0, 41)
}

/**
 * Sanitize postal code for QBO
 * Canadian format: A1A 1A1 (letter-digit-letter space digit-letter-digit)
 */
function sanitizePostalCode(postal: string | undefined): string {
  if (!postal) return ''
  const cleaned = postal
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.substring(0, 10)
}

/**
 * Sanitize city name
 */
function sanitizeCity(city: string | undefined): string {
  if (!city) return ''
  return city
    .replace(/[^\w\s\-.,]/g, '')
    .trim()
    .substring(0, 41)
}

/**
 * Convert province/state name or code to QBO 2-letter code
 * Handles both full names (Alberta) and codes (AB)
 */
function normalizeProvinceCode(stateOrProvince: string | undefined): string {
  if (!stateOrProvince) return 'AB' // Default to Alberta if missing

  const normalized = stateOrProvince.trim().toUpperCase()

  // If already a 2-letter code, return it
  if (normalized.length === 2) return normalized

  // Map full province names to codes
  const provinceMap: Record<string, string> = {
    // Canadian provinces
    ALBERTA: 'AB',
    'BRITISH COLUMBIA': 'BC',
    MANITOBA: 'MB',
    'NEW BRUNSWICK': 'NB',
    'NEWFOUNDLAND AND LABRADOR': 'NL',
    'NOVA SCOTIA': 'NS',
    ONTARIO: 'ON',
    'PRINCE EDWARD ISLAND': 'PE',
    QUEBEC: 'QC',
    SASKATCHEWAN: 'SK',
    'NORTHWEST TERRITORIES': 'NT',
    NUNAVUT: 'NU',
    YUKON: 'YT',
    // US states (in case of cross-border data)
    ALABAMA: 'AL',
    ALASKA: 'AK',
    ARIZONA: 'AZ',
    ARKANSAS: 'AR',
    CALIFORNIA: 'CA',
    COLORADO: 'CO',
    CONNECTICUT: 'CT',
    DELAWARE: 'DE',
    FLORIDA: 'FL',
    GEORGIA: 'GA',
    HAWAII: 'HI',
    IDAHO: 'ID',
    ILLINOIS: 'IL',
    INDIANA: 'IN',
    IOWA: 'IA',
    KANSAS: 'KS',
    KENTUCKY: 'KY',
    LOUISIANA: 'LA',
    MAINE: 'ME',
    MARYLAND: 'MD',
    MASSACHUSETTS: 'MA',
    MICHIGAN: 'MI',
    MINNESOTA: 'MN',
    MISSISSIPPI: 'MS',
    MISSOURI: 'MO',
    MONTANA: 'MT',
    NEBRASKA: 'NE',
    NEVADA: 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    OHIO: 'OH',
    OKLAHOMA: 'OK',
    OREGON: 'OR',
    PENNSYLVANIA: 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    TENNESSEE: 'TN',
    TEXAS: 'TX',
    UTAH: 'UT',
    VERMONT: 'VT',
    VIRGINIA: 'VA',
    WASHINGTON: 'WA',
    'WEST VIRGINIA': 'WV',
    WISCONSIN: 'WI',
    WYOMING: 'WY',
  }

  return provinceMap[normalized] || normalized.substring(0, 2)
}

interface QBOEmployee {
  Id: string
  SyncToken?: string
  GivenName?: string
  MiddleName?: string
  FamilyName?: string
  Suffix?: string
  DisplayName?: string
  Title?: string
  PrintOnCheckName?: string
  Active?: boolean
  EmployeeNumber?: string
  SSN?: string
  PrimaryPhone?: { FreeFormNumber: string }
  Mobile?: { FreeFormNumber: string }
  PrimaryEmailAddr?: { Address: string }
  PrimaryAddr?: {
    Line1?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
  }
  HiredDate?: string
  ReleasedDate?: string
  BirthDate?: string
  Gender?: string
  BillRate?: number
  BillableTime?: boolean
  MetaData?: { CreateTime: string; LastUpdatedTime: string }
}

interface PayrollEmployee {
  id: string
  syncToken?: string
  title?: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  displayName?: string
  printOnCheckName?: string
  employeeNumber?: string
  status: 'ACTIVE' | 'INACTIVE'
  ssn?: string
  primaryPhone?: { FreeFormNumber: string }
  mobile?: { FreeFormNumber: string }
  primaryEmailAddress?: { Address: string }
  primaryAddress?: {
    line1?: string
    city: string
    countrySubDivisionCode: string
    postalCode?: string
  }
  hiredDate?: string
  birthDate?: string
  gender?: string
  billRate?: number
  billableTime?: boolean
  metaData?: { createTime: string; lastUpdatedTime: string }
}

/**
 * GET /api/quickbooks/payroll/employees
 * Fetches employee list from QuickBooks Accounting API using REST
 */
const handler = withAuth(async (_request) => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get QuickBooks integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_type', 'quickbooks')
      .single()

    if (integrationError || !integration?.is_active) {
      console.error('[QBO Employees] Integration not found or inactive:', integrationError)
      return NextResponse.json(
        { error: 'QuickBooks integration not connected', code: 'QBO_NOT_CONNECTED' },
        { status: 400 }
      )
    }

    // Verify integration is configured
    if (!integration.settings?.realm_id) {
      console.error('[QBO Employees] Missing realm ID in integration settings')
      return NextResponse.json(
        { error: 'QuickBooks integration is not properly configured (missing Realm ID)' },
        { status: 400 }
      )
    }

    // Get valid access token
    let accessToken: string
    let realmId: string
    try {
      ({ accessToken, realmId } = await getValidAccessToken(supabase, integration.id))
    } catch (tokenError) {
      console.error('[QBO Employees] Token error:', tokenError)
      const errorMsg = tokenError instanceof Error ? tokenError.message : String(tokenError)

      if (errorMsg.includes('refresh token') || errorMsg.includes('expired')) {
        await supabase
          .from('integrations')
          .update({
            needs_reauth: true,
            last_auth_error: 'QuickBooks authorization expired. Please reconnect.',
          })
          .eq('id', integration.id)

        return NextResponse.json(
          {
            error: 'QuickBooks authorization expired. Please reconnect your integration.',
            requiresReauthorization: true
          },
          { status: 403 }
        )
      }

      throw tokenError
    }

    // Build QBO JPQL query for active employees — use SELECT * to avoid field validation errors
    const query = `SELECT * FROM Employee WHERE Active = true ORDERBY DisplayName MAXRESULTS 1000`

    const result = await queryQBO(query, accessToken, realmId)
    const qboEmployees = (result.QueryResponse?.Employee || []) as QBOEmployee[]

    // Transform QBO employees to expected format
    const employees: PayrollEmployee[] = qboEmployees.map((emp) => ({
      id: emp.Id,
      syncToken: emp.SyncToken,
      title: emp.Title,
      firstName: emp.GivenName || emp.DisplayName?.split(' ')[0] || '',
      middleName: emp.MiddleName,
      lastName: emp.FamilyName || emp.DisplayName?.split(' ').slice(1).join(' ') || '',
      suffix: emp.Suffix,
      displayName: emp.DisplayName,
      printOnCheckName: emp.PrintOnCheckName,
      employeeNumber: emp.EmployeeNumber,
      status: emp.Active ? 'ACTIVE' : 'INACTIVE',
      ssn: emp.SSN,
      primaryPhone: emp.PrimaryPhone,
      mobile: emp.Mobile,
      primaryEmailAddress: emp.PrimaryEmailAddr,
      primaryAddress: emp.PrimaryAddr
        ? {
            line1: emp.PrimaryAddr.Line1,
            city: emp.PrimaryAddr.City || '',
            countrySubDivisionCode: emp.PrimaryAddr.CountrySubDivisionCode || '',
            postalCode: emp.PrimaryAddr.PostalCode,
          }
        : undefined,
      hiredDate: emp.HiredDate,
      birthDate: emp.BirthDate,
      gender: emp.Gender,
      billRate: emp.BillRate,
      billableTime: emp.BillableTime,
      metaData: emp.MetaData
        ? {
            createTime: emp.MetaData.CreateTime,
            lastUpdatedTime: emp.MetaData.LastUpdatedTime,
          }
        : undefined,
    }))

    return NextResponse.json({
      success: true,
      employees,
      pageInfo: { hasNextPage: false, endCursor: null },
      totalCount: employees.length,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[QBO Employees] Error:', errorMsg)

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'QuickBooks authentication failed',
          details: 'Your QuickBooks session has expired. Please reconnect.',
          requiresReauthorization: true
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch employees from QuickBooks',
        details: errorMsg,
      },
      { status: 500 }
    )
  }
})

/**
 * POST /api/quickbooks/payroll/employees
 * Creates a new employee in QuickBooks Accounting
 */
const postHandler = withAuth(async (request) => {
  try {
    const body = await request.json()
    const { firstName, lastName, displayName, employeeNumber, eid } = body as {
      firstName: string
      lastName: string
      displayName?: string
      employeeNumber?: string
      eid?: string
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'firstName and lastName are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get QuickBooks integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_type', 'quickbooks')
      .single()

    if (integrationError || !integration?.is_active) {
      console.error('[QBO Employees Create] Integration not found or inactive:', integrationError)
      return NextResponse.json(
        { error: 'QuickBooks integration not connected', code: 'QBO_NOT_CONNECTED' },
        { status: 400 }
      )
    }

    // Verify integration is configured
    if (!integration.settings?.realm_id) {
      console.error('[QBO Employees Create] Missing realm ID in integration settings')
      return NextResponse.json(
        { error: 'QuickBooks integration is not properly configured (missing Realm ID)' },
        { status: 400 }
      )
    }

    // Get valid access token
    let accessToken: string
    let realmId: string
    try {
      ({ accessToken, realmId } = await getValidAccessToken(supabase, integration.id))
    } catch (tokenError) {
      console.error('[QBO Employees Create] Token error:', tokenError)
      const errorMsg = tokenError instanceof Error ? tokenError.message : String(tokenError)

      if (errorMsg.includes('refresh token') || errorMsg.includes('expired')) {
        await supabase
          .from('integrations')
          .update({
            needs_reauth: true,
            last_auth_error: 'QuickBooks authorization expired. Please reconnect.',
          })
          .eq('id', integration.id)

        return NextResponse.json(
          {
            error: 'QuickBooks authorization expired. Please reconnect your integration.',
            requiresReauthorization: true
          },
          { status: 403 }
        )
      }

      throw tokenError
    }

    // XA Security default address (fallback) - pre-sanitized
    const defaultAddress = {
      Line1: sanitizeAddressLine('1711 10 Ave SW #100'),
      City: sanitizeCity('Calgary'),
      CountrySubDivisionCode: normalizeProvinceCode('AB'),
      Country: 'CA',
      PostalCode: sanitizePostalCode('T3C 0K1'),
    }

    // Try to fetch address from Humanity if EID is provided
    let humanityAddress: { address?: string; city?: string; zip?: string; state?: string } | null = null
    if (eid) {
      try {
        const humanityToken = await getHumanityAccessToken()
        if (humanityToken) {
          humanityAddress = await fetchEmployeeByEid(humanityToken, eid)
          console.log('[QBO Employees Create] Fetched Humanity address (raw):', humanityAddress)
        }
      } catch (err) {
        console.warn('[QBO Employees Create] Failed to fetch from Humanity:', err)
        // Continue with fallback address
      }
    }

    // Attempt to create employee with Humanity address first, then fallback
    const primaryAddr = {
      Line1: sanitizeAddressLine(humanityAddress?.address || defaultAddress.Line1),
      City: sanitizeCity(humanityAddress?.city || defaultAddress.City),
      CountrySubDivisionCode: normalizeProvinceCode(humanityAddress?.state || defaultAddress.CountrySubDivisionCode) || 'AB',
      Country: defaultAddress.Country,
      PostalCode: sanitizePostalCode(humanityAddress?.zip || defaultAddress.PostalCode),
    }

    const usedHumanityAddress = !!humanityAddress

    console.log('[QBO Employees Create] Sanitized address for QBO:', primaryAddr)

    // STEP 1: Minimal create with only GivenName, FamilyName, PrimaryAddr
    let created: Record<string, unknown> | undefined
    let primaryAddrUsed = primaryAddr

    try {
      const createPayload: Record<string, unknown> = {
        GivenName: firstName,
        FamilyName: lastName,
        PrimaryAddr: primaryAddrUsed,
      }

      console.log('[QBO Employees Create] Step 1 - Minimal create payload:', createPayload)

      let result = await makeQBORequest(
        '/employee',
        accessToken,
        realmId,
        {
          method: 'POST',
          body: createPayload,
        }
      )

      const createTid = result.intuitTid

      // Check for QBO Fault in response
      if (result.data && typeof result.data === 'object' && 'Fault' in result.data) {
        const fault = (result.data as Record<string, unknown>).Fault as Record<string, unknown>
        const faultStr = JSON.stringify(fault)

        // If BadAddress error and we used Humanity data, retry with XA fallback
        if (faultStr.includes('BadAddress') && usedHumanityAddress) {
          console.log('[QBO Employees Create] BadAddress error with Humanity data, retrying Step 1 with fallback address', { tid: createTid || 'unknown' })

          const fallbackCreatePayload: Record<string, unknown> = {
            GivenName: firstName,
            FamilyName: lastName,
            PrimaryAddr: defaultAddress,
          }

          result = await makeQBORequest(
            '/employee',
            accessToken,
            realmId,
            {
              method: 'POST',
              body: fallbackCreatePayload,
            }
          )

          // Check if fallback succeeded
          const fallbackTid = result.intuitTid
          if (result.data && typeof result.data === 'object' && 'Fault' in result.data) {
            const fallbackFault = (result.data as Record<string, unknown>).Fault
            console.error('[QBO Employees Create] Fallback create also failed:', fallbackFault, { tid: fallbackTid || 'unknown' })
            return NextResponse.json(
              {
                error: 'Failed to create employee in QuickBooks',
                details: fallbackFault,
              },
              { status: 400 }
            )
          }

          console.log('[QBO Employees Create] Fallback address succeeded', { tid: fallbackTid || 'unknown' })
          primaryAddrUsed = defaultAddress
        } else {
          console.error('[QBO Employees Create] Step 1 failed with QBO Fault:', fault, { tid: createTid || 'unknown' })
          return NextResponse.json(
            {
              error: 'Failed to create employee in QuickBooks',
              details: fault,
            },
            { status: 400 }
          )
        }
      }

      // Extract created employee
      created = (result.data as Record<string, unknown>)?.Employee as Record<string, unknown> | undefined
      if (!created?.Id) {
        console.error('[QBO Employees Create] No employee ID in create response', { tid: result.intuitTid || 'unknown' })
        return NextResponse.json(
          { error: 'Failed to create employee: no ID in response', details: result.data },
          { status: 400 }
        )
      }

      const qboId = created.Id as string
      const syncToken = created.SyncToken as string

      console.log('[QBO Employees Create] Step 1 succeeded, created employee:', { qboId, syncToken, tid: result.intuitTid || 'unknown' })
    } catch (step1Error) {
      // Step 1 threw an exception (e.g., SystemFailure 500, OptimisticLock 400)
      // Attempt recovery: look up employee by name
      const step1ErrorMsg = step1Error instanceof Error ? step1Error.message : String(step1Error)
      const isSystemFailure = step1ErrorMsg.includes('10000') || step1ErrorMsg.includes('SystemFault') || step1ErrorMsg.includes('SystemFailureError')
      const isOptimisticLock = step1ErrorMsg.includes('OptimisticLock') || step1ErrorMsg.includes('6000')
      const isRecoverableError = isSystemFailure || isOptimisticLock

      if (isRecoverableError) {
        const errorType = isSystemFailure ? 'SystemFailure' : 'OptimisticLockError'
        console.warn(`[QBO Employees Create] Step 1 returned ${errorType}, attempting recovery via name lookup`, { error: step1ErrorMsg })

        try {
          const queryStr = `SELECT * FROM Employee WHERE GivenName = '${firstName.replace(/'/g, "''")}' AND FamilyName = '${lastName.replace(/'/g, "''")}' MAXRESULTS 1000`
          console.log('[QBO Employees Create] Recovery: executing query', { queryStr })

          const lookupResult = await makeQBORequest(
            `/query?query=${encodeURIComponent(queryStr)}`,
            accessToken,
            realmId
          )

          console.log('[QBO Employees Create] Recovery: lookup response', { data: JSON.stringify(lookupResult.data).substring(0, 500) })

          // Check for Fault in lookup response
          if (lookupResult.data && typeof lookupResult.data === 'object' && 'Fault' in lookupResult.data) {
            const lookupFault = (lookupResult.data as Record<string, unknown>).Fault
            console.error('[QBO Employees Create] Recovery: lookup returned Fault:', lookupFault)
            throw step1Error // Lookup failed, re-throw original error
          }

          const queryResponse = (lookupResult.data as Record<string, unknown>)?.QueryResponse as Record<string, unknown> | undefined
          let employees = (queryResponse?.Employee as unknown[]) || []

          // Handle case where Employee is a single object instead of array
          if (employees && !Array.isArray(employees)) {
            employees = [employees as unknown]
          }

          console.log('[QBO Employees Create] Recovery: found employees', { count: employees.length })

          if (Array.isArray(employees) && employees.length === 1) {
            created = employees[0] as Record<string, unknown>
            console.warn('[QBO Employees Create] Step 1 returned error but employee was found via name lookup — proceeding to Step 2', {
              qboId: created.Id,
              tid: lookupResult.intuitTid || 'unknown',
            })
            // Fall through to Step 2 with the recovered employee
          } else {
            console.error('[QBO Employees Create] Recovery: unexpected result count', { count: employees.length, tid: lookupResult.intuitTid || 'unknown', queryStr })
            throw step1Error // Re-throw original error
          }
        } catch (recoveryError) {
          const recoveryMsg = recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
          console.error('[QBO Employees Create] Recovery lookup failed:', { error: recoveryMsg, firstName, lastName })
          throw step1Error // Re-throw original Step 1 error
        }
      } else {
        throw step1Error // Re-throw if not a SystemFailure
      }
    }

    // Ensure created employee was obtained (either from Step 1 or recovery)
    if (!created?.Id) {
      console.error('[QBO Employees Create] No employee ID available after Step 1 or recovery')
      return NextResponse.json(
        { error: 'Failed to create or recover employee in QuickBooks' },
        { status: 500 }
      )
    }

    const qboId = created.Id as string
    const syncToken = created.SyncToken as string

    // STEP 2: Full update with remaining fields
    const updatePayload: Record<string, unknown> = {
      Id: qboId,
      SyncToken: syncToken,
      GivenName: firstName,
      FamilyName: lastName,
      DisplayName: displayName || `${firstName} ${lastName}`,
      PrintOnCheckName: displayName || `${firstName} ${lastName}`,
      PrimaryAddr: primaryAddrUsed,
    }

    if (employeeNumber) {
      updatePayload.EmployeeNumber = employeeNumber
    }

    if (humanityAddress?.phone) {
      updatePayload.PrimaryPhone = { FreeFormNumber: humanityAddress.phone }
    }

    if (humanityAddress?.email) {
      updatePayload.PrimaryEmailAddr = { Address: humanityAddress.email }
    }

    if (humanityAddress?.mobilePhone) {
      updatePayload.Mobile = { FreeFormNumber: humanityAddress.mobilePhone }
    }

    if (humanityAddress?.birthDate) {
      updatePayload.BirthDate = humanityAddress.birthDate
    }

    console.log('[QBO Employees Create] Step 2 - Full update payload:', updatePayload)

    let updateResult
    let updateTid = 'unknown'
    try {
      updateResult = await makeQBORequest(
        '/employee',
        accessToken,
        realmId,
        {
          method: 'POST',
          body: updatePayload,
        }
      )

      if (!updateResult) {
        console.warn('[QBO Employees Create] Step 2 returned no result, but employee was created in Step 1:', { qboId })
        return NextResponse.json({
          success: true,
          employee: created,
          updateWarning: 'Employee created successfully, but additional details could not be synced.',
        })
      }

      updateTid = updateResult.intuitTid || 'unknown'

      // Check for update faults - attempt recovery for OptimisticLock, otherwise return created employee
      if (updateResult.data && typeof updateResult.data === 'object' && 'Fault' in updateResult.data) {
        const updateFault = (updateResult.data as Record<string, unknown>).Fault
        const faultStr = JSON.stringify(updateFault)

        if (faultStr.includes('OptimisticLock')) {
          console.warn('[QBO Employees Create] Step 2 hit OptimisticLock, attempting refresh and retry...', { qboId, tid: updateTid })
          try {
            // Fetch fresh employee to get updated SyncToken
            const freshResult = await makeQBORequest(
              `/employee/${qboId}`,
              accessToken,
              realmId
            )

            const freshEmployee = (freshResult.data as Record<string, unknown>)?.Employee as Record<string, unknown> | undefined
            if (freshEmployee?.SyncToken) {
              console.log('[QBO Employees Create] Step 2 refresh succeeded, retrying update', { qboId, newSyncToken: freshEmployee.SyncToken, tid: freshResult.intuitTid || 'unknown' })

              // Retry update with fresh SyncToken
              const retryPayload = { ...updatePayload, SyncToken: freshEmployee.SyncToken }
              const retryResult = await makeQBORequest(
                '/employee',
                accessToken,
                realmId,
                {
                  method: 'POST',
                  body: retryPayload,
                }
              )

              // Check if retry succeeded
              if (retryResult.data && typeof retryResult.data === 'object' && 'Fault' in retryResult.data) {
                const retryFault = (retryResult.data as Record<string, unknown>).Fault
                console.warn('[QBO Employees Create] Step 2 retry failed, returning created employee:', { qboId, tid: retryResult.intuitTid || 'unknown', fault: retryFault })
                return NextResponse.json({
                  success: true,
                  employee: created,
                  updateWarning: 'Employee created but full update failed. Some details could not be synced.',
                })
              }

              // Extract retried employee
              const retried = (retryResult.data as Record<string, unknown>)?.Employee || retryResult.data
              console.log('[QBO Employees Create] Step 2 retry succeeded after OptimisticLock', { qboId, tid: retryResult.intuitTid || 'unknown' })
              return NextResponse.json({
                success: true,
                employee: retried,
              })
            }
          } catch (refreshError) {
            const refreshMsg = refreshError instanceof Error ? refreshError.message : String(refreshError)
            console.warn('[QBO Employees Create] Step 2 refresh/retry failed, returning created employee:', { qboId, error: refreshMsg })
          }
        }

        console.warn('[QBO Employees Create] Step 2 update failed, but employee was created:', { qboId, tid: updateTid, fault: updateFault })
        // Return the created employee since the create succeeded
        return NextResponse.json({
          success: true,
          employee: created,
          updateWarning: 'Employee created but full update failed. SSN and other fields were not set.',
        })
      }

      // Extract updated employee
      const updated = (updateResult.data as Record<string, unknown>)?.Employee || updateResult.data

      console.log('[QBO Employees Create] Step 2 succeeded', { qboId, tid: updateTid })

      return NextResponse.json({
        success: true,
        employee: updated,
      })
    } catch (updateError) {
      // Step 2 update threw an exception, but employee was created in Step 1
      const updateErrorMsg = updateError instanceof Error ? updateError.message : String(updateError)

      // Check if it's an OptimisticLock error — attempt refresh and retry
      if (updateErrorMsg.includes('OptimisticLock')) {
        console.warn('[QBO Employees Create] Step 2 threw OptimisticLock, attempting refresh and retry...', { qboId, error: updateErrorMsg })
        try {
          // Fetch fresh employee to get updated SyncToken
          const freshResult = await makeQBORequest(
            `/employee/${qboId}`,
            accessToken,
            realmId
          )

          const freshEmployee = (freshResult.data as Record<string, unknown>)?.Employee as Record<string, unknown> | undefined
          if (freshEmployee?.SyncToken) {
            console.log('[QBO Employees Create] Step 2 catch: refresh succeeded, retrying update', { qboId, newSyncToken: freshEmployee.SyncToken, tid: freshResult.intuitTid || 'unknown' })

            // Retry update with fresh SyncToken
            const retryPayload = { ...updatePayload, SyncToken: freshEmployee.SyncToken }
            const retryResult = await makeQBORequest(
              '/employee',
              accessToken,
              realmId,
              {
                method: 'POST',
                body: retryPayload,
              }
            )

            // Check if retry succeeded
            if (retryResult.data && typeof retryResult.data === 'object' && 'Fault' in retryResult.data) {
              const retryFault = (retryResult.data as Record<string, unknown>).Fault
              console.warn('[QBO Employees Create] Step 2 catch: retry failed, returning created employee:', { qboId, tid: retryResult.intuitTid || 'unknown', fault: retryFault })
              return NextResponse.json({
                success: true,
                employee: created,
                updateWarning: 'Employee created but full update failed. Some details could not be synced.',
              })
            }

            // Extract retried employee
            const retried = (retryResult.data as Record<string, unknown>)?.Employee || retryResult.data
            console.log('[QBO Employees Create] Step 2 catch: retry succeeded after OptimisticLock', { qboId, tid: retryResult.intuitTid || 'unknown' })
            return NextResponse.json({
              success: true,
              employee: retried,
            })
          }
        } catch (refreshError) {
          const refreshMsg = refreshError instanceof Error ? refreshError.message : String(refreshError)
          console.warn('[QBO Employees Create] Step 2 catch: refresh/retry failed, returning created employee:', { qboId, error: refreshMsg })
        }
      }

      console.warn('[QBO Employees Create] Step 2 update threw exception, but employee was created:', { qboId, tid: updateTid, error: updateErrorMsg })

      // Return the created employee since the create succeeded
      return NextResponse.json({
        success: true,
        employee: created,
        updateWarning: 'Employee created successfully, but additional details (SSN, birth date, etc.) could not be updated. You can manually edit the employee in QuickBooks.',
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const tid = errorMsg.match(/\[TID: ([^\]]+)\]/)?.[1] || 'unknown'
    console.error('[QBO Employees Create] Error:', errorMsg, { tid })

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'QuickBooks authentication failed',
          details: 'Your QuickBooks session has expired. Please reconnect.',
          requiresReauthorization: true
        },
        { status: 403 }
      )
    }

    const isSystemFailure = errorMsg.includes('10000') || errorMsg.includes('SystemFault') || errorMsg.includes('SystemFailureError')
    return NextResponse.json(
      {
        error: isSystemFailure
          ? 'QBO experienced an internal error. Please wait a moment and try again.'
          : 'Failed to create employee in QuickBooks',
        details: errorMsg,
        isSystemFailure,
      },
      { status: 500 }
    )
  }
})

export const GET = handler
export const POST = postHandler
