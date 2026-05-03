import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const DELETE = withAuth(async (request: NextRequest, user, context) => {
  try {
    const { attachmentId } = await context!.params

    const { data: attachment, error: fetchError } = await supabase
      .from('payroll_tracker_issue_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase.storage
      .from('payroll-attachments')
      .remove([attachment.file_url])

    if (deleteError) throw deleteError

    const { error: dbError } = await supabase
      .from('payroll_tracker_issue_attachments')
      .delete()
      .eq('id', attachmentId)

    if (dbError) throw dbError

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
})
