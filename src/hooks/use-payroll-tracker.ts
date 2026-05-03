import { useQuery } from '@tanstack/react-query'
import { authFetch } from '@/lib/api-client'

export interface PayrollTrackerAttachment {
  id: string
  issue_id: string
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface PayrollTrackerIssue {
  id: string
  employee_name: string
  salary: number | null
  type: 'garnishment' | 'deduction' | 'expense' | 'payroll_correction' | 'bonus' | 'other'
  amount: number
  direction: 'owe_employee' | 'employee_owes'
  pay_period_start: string
  pay_period_end: string
  pay_period_label: string | null
  notes: string
  status: 'outstanding' | 'resolved'
  created_by_email: string | null
  created_by_name: string | null
  created_by_avatar_url: string | null
  is_recurring: boolean
  recurring_source_id: string | null
  period_archived: boolean
  created_at: string
  updated_at: string
  attachments?: PayrollTrackerAttachment[]
}

export function usePayrollTrackerIssues() {
  return useQuery({
    queryKey: ['payroll-tracker-issues'],
    queryFn: async () => {
      const response = await authFetch('/api/finance/payroll-tracker')
      if (response.status === 401) {
        window.location.href = '/auth/login'
        throw new Error('Unauthorized')
      }
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch payroll tracker issues')
      }
      const data = await response.json()
      return data.issues as PayrollTrackerIssue[]
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}
