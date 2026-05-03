import { createClient } from '@/lib/supabase/server'

const serverLog = (prefix: string, message: string, data?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  console.log(`[${timestamp}] ${prefix} ${message}${dataStr}`)
}

const serverError = (prefix: string, message: string, error?: unknown) => {
  const timestamp = new Date().toISOString()
  const errorStr = error instanceof Error ? error.message : String(error)
  console.error(`[${timestamp}] ${prefix} ${message}: ${errorStr}`)
}

/**
 * Fetches Microsoft user profile photo and uploads to Supabase Storage
 * @param accessToken - Microsoft Graph API access token
 * @param userId - Supabase user ID for filename
 * @returns URL of uploaded avatar or null if fetch/upload failed
 */
export async function fetchAndStoreMicrosoftAvatar(
  accessToken: string,
  userId: string
): Promise<string | null> {
  try {
    serverLog('[Microsoft:Avatar]', 'Starting avatar fetch and upload process', {
      userIdLength: userId.length,
      hasAccessToken: !!accessToken,
    })

    // Step 1: Fetch photo from Microsoft Graph
    const photoStart = Date.now()
    serverLog('[Microsoft:Avatar]', 'Fetching photo from Microsoft Graph API')

    const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!photoResponse.ok) {
      // This is not an error - user might not have a photo
      if (photoResponse.status === 404) {
        serverLog('[Microsoft:Avatar]', 'No photo found in Microsoft account (404)', {
          duration: Date.now() - photoStart,
        })
        return null
      }

      serverError('[Microsoft:Avatar]', "Failed to fetch photo from Microsoft Graph", {
        status: photoResponse.status,
        statusText: photoResponse.statusText,
      })
      return null
    }

    const photoBuffer = await photoResponse.arrayBuffer()
    const photoBytes = Buffer.from(photoBuffer)

    serverLog('[Microsoft:Avatar]', 'Photo fetched successfully from Microsoft Graph', {
      duration: Date.now() - photoStart,
      photoSize: photoBytes.length,
    })

    // Step 2: Determine file extension based on Content-Type
    const contentType = photoResponse.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg'
    const filename = `${userId}-${Date.now()}.${ext}`

    serverLog('[Microsoft:Avatar]', 'Prepared upload', {
      filename,
      contentType,
      filesize: photoBytes.length,
    })

    // Step 3: Upload to Supabase Storage
    const uploadStart = Date.now()
    const supabase = await createClient()

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filename, photoBytes, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      serverError('[Microsoft:Avatar]', 'Failed to upload avatar to Supabase Storage', uploadError)
      return null
    }

    serverLog('[Microsoft:Avatar]', 'Avatar uploaded successfully', {
      duration: Date.now() - uploadStart,
      path: uploadData?.path,
    })

    // Step 4: Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(uploadData.path)

    const publicUrl = publicUrlData?.publicUrl

    serverLog('[Microsoft:Avatar]', 'Avatar fetch and upload completed', {
      publicUrl: publicUrl?.substring(0, 100) || 'N/A',
      filename,
    })

    return publicUrl || null
  } catch (error) {
    serverError('[Microsoft:Avatar]', 'Unexpected error during avatar fetch/upload', error)
    return null
  }
}
