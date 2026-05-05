import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const buffer = await file.arrayBuffer()
    const bytes = Buffer.from(buffer)

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}-${Date.now()}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filename, bytes, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[API:profile/me/avatar] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(uploadData.path)

    const publicUrl = publicUrlData?.publicUrl

    if (!publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('[API:profile/me/avatar] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
