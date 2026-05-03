import { cookies } from 'next/headers'
import { getSessionFromCookies } from '@/lib/secure-session'
import { PayrollReportClient } from './PayrollReportClient'

export default async function PayrollReportPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  return (
    <PayrollReportClient isAuthenticated={!!session} />
  )
}
