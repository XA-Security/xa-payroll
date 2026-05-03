/**
 * Resend email client wrapper
 * Provides a singleton Resend client and typed sendEmail() function
 */

import { Resend } from 'resend'

let resendClient: Resend | null = null

/**
 * Get or create Resend client singleton
 */
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const { to, subject, html, from } = options
    const client = getResendClient()

    const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'noreply@xasecurity.ca'
    const toAddresses = Array.isArray(to) ? to : [to]

    console.log(`[Resend] Sending email. From: ${fromEmail}, To: ${toAddresses.join(', ')}, Subject: "${subject}"`)

    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    if (result.error) {
      console.error(`[Resend] API error: ${result.error.message}`)
      return {
        success: false,
        error: result.error.message,
      }
    }

    const messageId = result.data?.id
    console.log(`[Resend] ✓ Email sent. Message ID: ${messageId}`)
    return {
      success: true,
      messageId,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email'
    console.error(`[Resend] Exception: ${errorMessage}`, error)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
