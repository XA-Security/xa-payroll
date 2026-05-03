import { parse, format } from 'date-fns'

export interface PayrollCycle {
  label: string
  startDate: string
  endDate: string
  payDate: string
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function generatePayrollCycles(_today: string): PayrollCycle[] {
  const anchorDate = '2026-03-17'
  const cycles: PayrollCycle[] = []

  for (let n = -6; n <= 13; n++) {
    const startDate = addDays(anchorDate, n * 14)
    const endDate = addDays(startDate, 13)
    const payDate = addDays(endDate, 10)

    const startLabel = format(parse(startDate, 'yyyy-MM-dd', new Date()), 'MMM d')
    const endLabel = format(parse(endDate, 'yyyy-MM-dd', new Date()), 'MMM d')
    const payLabel = format(parse(payDate, 'yyyy-MM-dd', new Date()), 'MMM d')

    const label = `${startLabel} – ${endLabel}  ·  Pay ${payLabel}`

    cycles.push({ label, startDate, endDate, payDate })
  }

  return cycles
}

export function detectCurrentCycle(cycles: PayrollCycle[], today: string): string {
  // Priority 1: cycle that has ended but pay date hasn't passed
  for (const cycle of cycles) {
    if (cycle.endDate < today && today <= cycle.payDate) {
      return cycle.startDate
    }
  }

  // Priority 2: cycle that contains today
  for (const cycle of cycles) {
    if (cycle.startDate <= today && today <= cycle.endDate) {
      return cycle.startDate
    }
  }

  // Priority 3: closest cycle by pay date
  const todayDate = new Date(today)
  let closestCycle = cycles[0]
  let minDiff = Math.abs(new Date(cycles[0].payDate).getTime() - todayDate.getTime())

  for (const cycle of cycles) {
    const diff = Math.abs(new Date(cycle.payDate).getTime() - todayDate.getTime())
    if (diff < minDiff) {
      minDiff = diff
      closestCycle = cycle
    }
  }

  return closestCycle.startDate
}
