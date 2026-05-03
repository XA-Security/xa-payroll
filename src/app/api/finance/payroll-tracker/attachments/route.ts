import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const formData = await request.formData()
    const issueId = formData.get('issue_id') as string
    const file = formData.get('file') as File

    if (!issueId || !file) {
      return NextResponse.json(
        { success: false, error: 'Missing issue_id or file' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const filePath = `${issueId}/${uniqueFileName}`

    const { error: uploadError } = await supabase.storage
      .from('payroll-attachments')
      .upload(filePath, bytes, {
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('payroll_tracker_issue_attachments')
      .insert({
        issue_id: issueId,
        file_name: file.name,
        file_url: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.email,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, attachment: data }, { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload attachment' },
      { status: 500 }
    )
  }
})

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const issueId = searchParams.get('issue_id')

    if (!issueId) {
      return NextResponse.json(
        { success: false, error: 'Missing issue_id parameter' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('payroll_tracker_issue_attachments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, attachments: data ?? [] })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
})
