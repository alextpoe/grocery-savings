import { Resend } from 'resend'

export { WelcomeEmail } from './emails/welcome'
export { ResetPasswordEmail } from './emails/reset-password'
export { MagicLinkEmail } from './emails/magic-link'

/**
 * Create a Resend client
 * Should be called server-side only
 */
export function createResendClient(apiKey: string) {
  return new Resend(apiKey)
}

/**
 * Email sending utilities
 */
export interface SendEmailOptions {
  from: string
  to: string | string[]
  subject: string
  react: React.ReactElement
}

export async function sendEmail(
  client: Resend,
  options: SendEmailOptions
): Promise<{ id: string }> {
  const { data, error } = await client.emails.send(options)

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { id: data!.id }
}
