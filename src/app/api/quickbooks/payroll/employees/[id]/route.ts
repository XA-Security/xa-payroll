import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'
import { getValidAccessToken, makeQBORequest } from '@/lib/quickbooks-client'

/**
 * GET /api/quickbooks/payroll/employees/[id]
 * Fetches a single employee from QuickBooks by ID
 */
const getHandler = withAuth(async (_request, _user, context) => {
  try {
    const params = await context?.params
    const id = params?.id as string | undefined

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
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
      console.error('[QBO Employee Detail] Integration not found or inactive:', integrationError)
      return NextResponse.json(
        { error: 'QuickBooks integration not connected' },
        { status: 400 }
      )
    }

    if (!integration.settings?.realm_id) {
      console.error('[QBO Employee Detail] Missing realm ID in integration settings')
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
      console.error('[QBO Employee Detail] Token error:', tokenError)
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
          { error: 'QuickBooks authorization expired. Please reconnect your integration.' },
          { status: 401 }
        )
      }

      throw tokenError
    }

    // Fetch the individual employee from QBO
    const result = await makeQBORequest(`/employee/${id}`, accessToken, realmId)

    if (!result.data) {
      console.error('[QBO Employee Detail] No employee data in response')
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Transform QBO employee to expected camelCase format
    const emp = result.data?.Employee ?? result.data
    const employee = {
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
    }

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[QBO Employee Detail] Error:', errorMsg)

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'QuickBooks authentication failed',
          details: 'Your QuickBooks session has expired. Please reconnect.',
        },
        { status: 401 }
      )
    }

    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      return NextResponse.json(
        { error: 'Employee not found', details: errorMsg },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch employee from QuickBooks',
        details: errorMsg,
      },
      { status: 500 }
    )
  }
})

/**
 * Converts camelCase employee object to QuickBooks PascalCase format
 * Filters out undefined values and read-only fields
 */
function convertEmployeeToQBO(employee: any): any {
  const qboEmployee: any = {
    Id: employee.id,
    SyncToken: employee.syncToken,
  }

  // Only include fields that are defined (QB doesn't like undefined in JSON)
  if (employee.title !== undefined) qboEmployee.Title = employee.title
  if (employee.firstName !== undefined) qboEmployee.GivenName = employee.firstName
  if (employee.middleName !== undefined) qboEmployee.MiddleName = employee.middleName
  if (employee.lastName !== undefined) qboEmployee.FamilyName = employee.lastName
  if (employee.suffix !== undefined) qboEmployee.Suffix = employee.suffix
  if (employee.displayName !== undefined) qboEmployee.DisplayName = employee.displayName
  if (employee.printOnCheckName !== undefined) qboEmployee.PrintOnCheckName = employee.printOnCheckName
  if (employee.employeeNumber !== undefined) qboEmployee.EmployeeNumber = employee.employeeNumber
  if (employee.status !== undefined) qboEmployee.Active = employee.status === 'ACTIVE'
  if (employee.ssn !== undefined) qboEmployee.SSN = employee.ssn
  if (employee.hiredDate !== undefined) qboEmployee.HiredDate = employee.hiredDate
  if (employee.birthDate !== undefined) qboEmployee.BirthDate = employee.birthDate
  if (employee.gender !== undefined) qboEmployee.Gender = employee.gender
  if (employee.billRate !== undefined) qboEmployee.BillRate = employee.billRate
  if (employee.billableTime !== undefined) qboEmployee.BillableTime = employee.billableTime

  // Handle phone fields
  if (employee.primaryPhone !== undefined) {
    qboEmployee.PrimaryPhone = employee.primaryPhone
  }
  if (employee.mobile !== undefined) {
    qboEmployee.Mobile = employee.mobile
  }

  // Handle email
  if (employee.primaryEmailAddress !== undefined) {
    qboEmployee.PrimaryEmailAddr = employee.primaryEmailAddress
  }

  // Handle address
  if (employee.primaryAddress !== undefined && employee.primaryAddress) {
    qboEmployee.PrimaryAddr = {
      Line1: employee.primaryAddress.line1,
      City: employee.primaryAddress.city,
      CountrySubDivisionCode: employee.primaryAddress.countrySubDivisionCode,
      PostalCode: employee.primaryAddress.postalCode,
    }
  }

  // Do NOT send metaData back to QB (it's read-only)
  // QB will reject unknown/unsupported properties

  console.log('[QBO Employee Update] Converted payload:', JSON.stringify(qboEmployee, null, 2))

  return qboEmployee
}

/**
 * POST /api/quickbooks/payroll/employees/[id]
 * Full update of an employee in QuickBooks
 * Note: QBO Employee does NOT support sparse updates, so the full object must be sent
 */
const postHandler = withAuth(async (request, _user) => {
  try {
    const body = await request.json()
    console.log('[QBO Employee Update] Incoming request body:', JSON.stringify(body, null, 2))

    if (!body.id) {
      return NextResponse.json(
        { error: 'Employee ID is required in request body' },
        { status: 400 }
      )
    }

    if (!body.syncToken) {
      return NextResponse.json(
        { error: 'SyncToken is required (must fetch current employee first)' },
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
      console.error('[QBO Employee Update] Integration not found or inactive:', integrationError)
      return NextResponse.json(
        { error: 'QuickBooks integration not connected' },
        { status: 400 }
      )
    }

    if (!integration.settings?.realm_id) {
      console.error('[QBO Employee Update] Missing realm ID in integration settings')
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
      console.error('[QBO Employee Update] Token error:', tokenError)
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
          { error: 'QuickBooks authorization expired. Please reconnect your integration.' },
          { status: 401 }
        )
      }

      throw tokenError
    }

    // Convert employee from camelCase to QB's PascalCase format
    const qboEmployee = convertEmployeeToQBO(body)

    // QBO Employee full update: POST to /employee with the complete object
    const result = await makeQBORequest('/employee', accessToken, realmId, {
      method: 'POST',
      body: qboEmployee,
    })

    console.log('[QBO Employee Update] Raw response:', JSON.stringify(result.data, null, 2))
    if (result.intuitTid) {
      console.log('[QBO Employee Update] Intuit TID:', result.intuitTid)
    }

    // Check for QBO Fault objects (QBO returns 200 + Fault JSON for validation errors)
    if (result.data && typeof result.data === 'object' && 'Fault' in result.data) {
      const fault = (result.data as any).Fault
      console.error('[QBO Employee Update] QBO returned a Fault:', JSON.stringify(fault, null, 2))
      const errorMessages = fault?.Error?.map((e: any) => `${e.code}: ${e.Message} — ${e.Detail}`).join('; ') || 'Unknown QBO error'
      return NextResponse.json(
        { error: 'QuickBooks rejected the employee update', details: errorMessages },
        { status: 400 }
      )
    }

    if (!result.data) {
      console.error('[QBO Employee Update] No employee data in response')
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 400 }
      )
    }

    // Transform QBO response back to camelCase
    const emp = result.data?.Employee ?? result.data
    const employee = {
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
    }

    console.log('[QBO Employee Update] Success — new syncToken:', employee.syncToken)

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[QBO Employee Update] Error:', errorMsg)

    // Check for SyncToken conflict (409 from Intuit)
    if (errorMsg.includes('409') || errorMsg.includes('Conflict') || errorMsg.includes('SyncToken')) {
      return NextResponse.json(
        {
          error: 'Sync token conflict',
          details: 'The employee record was modified by another user. Please refresh and try again.',
        },
        { status: 409 }
      )
    }

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'QuickBooks authentication failed',
          details: 'Your QuickBooks session has expired. Please reconnect.',
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update employee in QuickBooks',
        details: errorMsg,
      },
      { status: 500 }
    )
  }
})

export const GET = getHandler
export const POST = postHandler
