import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'
import { getValidAccessToken, makeQBORequest } from '@/lib/quickbooks-client'

/**
 * POST /api/quickbooks/payroll/employees/[id]/deactivate
 * Deactivates a QBO employee by setting Active = false
 * No request body required
 */
const postHandler = withAuth(async (_request, _user, context) => {
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
      console.error('[QBO Employee Deactivate] Integration not found or inactive:', integrationError)
      return NextResponse.json(
        { error: 'QuickBooks integration not connected' },
        { status: 400 }
      )
    }

    if (!integration.settings?.realm_id) {
      console.error('[QBO Employee Deactivate] Missing realm ID in integration settings')
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
      console.error('[QBO Employee Deactivate] Token error:', tokenError)
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

    // === Step 1: GET current employee to obtain SyncToken ===
    const getResult = await makeQBORequest(`/employee/${id}`, accessToken, realmId)

    if (!getResult.data) {
      console.error('[QBO Employee Deactivate] No employee data in response')
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const emp = getResult.data?.Employee ?? getResult.data

    if (!emp?.Id) {
      console.error('[QBO Employee Deactivate] Employee not found in QBO')
      return NextResponse.json(
        { error: 'Employee not found in QuickBooks' },
        { status: 404 }
      )
    }

    // === Step 2: Build payload preserving all fields, override Active to false ===
    // QBO requires a full update, so we preserve all existing fields
    const payload: any = {
      Id: emp.Id,
      SyncToken: emp.SyncToken,
      Active: false, // Deactivate
    }

    // Preserve all identity and required fields
    if (emp.GivenName !== undefined) payload.GivenName = emp.GivenName
    if (emp.FamilyName !== undefined) payload.FamilyName = emp.FamilyName
    if (emp.DisplayName !== undefined) payload.DisplayName = emp.DisplayName
    if (emp.PrintOnCheckName !== undefined) payload.PrintOnCheckName = emp.PrintOnCheckName

    // Preserve optional fields if present
    if (emp.MiddleName !== undefined) payload.MiddleName = emp.MiddleName
    if (emp.Suffix !== undefined) payload.Suffix = emp.Suffix
    if (emp.Title !== undefined) payload.Title = emp.Title
    if (emp.EmployeeNumber !== undefined) payload.EmployeeNumber = emp.EmployeeNumber
    if (emp.SSN !== undefined) payload.SSN = emp.SSN
    if (emp.HiredDate !== undefined) payload.HiredDate = emp.HiredDate
    if (emp.BirthDate !== undefined) payload.BirthDate = emp.BirthDate
    if (emp.Gender !== undefined) payload.Gender = emp.Gender
    if (emp.BillRate !== undefined) payload.BillRate = emp.BillRate
    if (emp.BillableTime !== undefined) payload.BillableTime = emp.BillableTime
    if (emp.PrimaryPhone !== undefined) payload.PrimaryPhone = emp.PrimaryPhone
    if (emp.Mobile !== undefined) payload.Mobile = emp.Mobile
    if (emp.PrimaryEmailAddr !== undefined) payload.PrimaryEmailAddr = emp.PrimaryEmailAddr
    if (emp.PrimaryAddr !== undefined) payload.PrimaryAddr = emp.PrimaryAddr

    console.log('[QBO Employee Deactivate] Deactivation payload:', JSON.stringify(payload, null, 2))

    // === Step 3: POST full update with Active = false ===
    const updateResult = await makeQBORequest('/employee', accessToken, realmId, {
      method: 'POST',
      body: payload,
    })

    console.log('[QBO Employee Deactivate] Raw response:', JSON.stringify(updateResult.data, null, 2))

    // Check for QBO Fault objects (QBO returns 200 + Fault JSON for validation errors)
    if (updateResult.data && typeof updateResult.data === 'object' && 'Fault' in updateResult.data) {
      const fault = (updateResult.data as any).Fault
      console.error('[QBO Employee Deactivate] QBO returned a Fault:', JSON.stringify(fault, null, 2))
      const errorMessages = fault?.Error?.map((e: any) => `${e.code}: ${e.Message}`).join('; ') || 'Unknown QBO error'
      return NextResponse.json(
        { error: 'QuickBooks rejected the deactivation', details: errorMessages },
        { status: 400 }
      )
    }

    if (!updateResult.data) {
      console.error('[QBO Employee Deactivate] No employee data in response')
      return NextResponse.json(
        { error: 'Failed to deactivate employee' },
        { status: 400 }
      )
    }

    // Transform QBO response back to camelCase
    const updated = updateResult.data?.Employee ?? updateResult.data
    const employee = {
      id: updated.Id,
      syncToken: updated.SyncToken,
      title: updated.Title,
      firstName: updated.GivenName || updated.DisplayName?.split(' ')[0] || '',
      middleName: updated.MiddleName,
      lastName: updated.FamilyName || updated.DisplayName?.split(' ').slice(1).join(' ') || '',
      suffix: updated.Suffix,
      displayName: updated.DisplayName,
      printOnCheckName: updated.PrintOnCheckName,
      employeeNumber: updated.EmployeeNumber,
      status: updated.Active ? 'ACTIVE' : 'INACTIVE',
      ssn: updated.SSN,
      primaryPhone: updated.PrimaryPhone,
      mobile: updated.Mobile,
      primaryEmailAddress: updated.PrimaryEmailAddr,
      primaryAddress: updated.PrimaryAddr
        ? {
            line1: updated.PrimaryAddr.Line1,
            city: updated.PrimaryAddr.City || '',
            countrySubDivisionCode: updated.PrimaryAddr.CountrySubDivisionCode || '',
            postalCode: updated.PrimaryAddr.PostalCode,
          }
        : undefined,
      hiredDate: updated.HiredDate,
      birthDate: updated.BirthDate,
      gender: updated.Gender,
      billRate: updated.BillRate,
      billableTime: updated.BillableTime,
      metaData: updated.MetaData
        ? {
            createTime: updated.MetaData.CreateTime,
            lastUpdatedTime: updated.MetaData.LastUpdatedTime,
          }
        : undefined,
    }

    console.log('[QBO Employee Deactivate] Success — deactivated employee:', employee.id)

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[QBO Employee Deactivate] Error:', errorMsg)

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
        error: 'Failed to deactivate employee',
        details: errorMsg,
      },
      { status: 500 }
    )
  }
})

export const POST = postHandler
