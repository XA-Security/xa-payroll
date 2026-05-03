// Finance utilities

export const approvalsRequired = (totalAmt: number): number => totalAmt < 500 ? 1 : 2

export const getApprovalStatus = (totalAmt: number, approvalCount: number): string => {
  const required = approvalsRequired(totalAmt)
  if (approvalCount === 0) return 'pending_approval'
  if (approvalCount >= required) return 'approved'
  return 'partially_approved'
}

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount)
}
