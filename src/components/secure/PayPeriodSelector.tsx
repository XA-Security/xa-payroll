'use client'

import { useEffect, useState } from 'react'
import { generatePayrollCycles, detectCurrentCycle, type PayrollCycle } from '@/lib/payroll-cycles'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface PayPeriodSelectorProps {
  value: string
  onChange: (startDate: string) => void
  disabled?: boolean
}

export function PayPeriodSelector({ value, onChange, disabled }: PayPeriodSelectorProps) {
  const [cycles, setCycles] = useState<PayrollCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const allCycles = generatePayrollCycles(today)
    setCycles(allCycles)

    if (!value) {
      const currentCycleStartDate = detectCurrentCycle(allCycles, today)
      onChange(currentCycleStartDate)
    }

    setIsLoading(false)
  }, [value, onChange])

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />
  }

  const today = new Date().toISOString().split('T')[0]
  const pastCycles = cycles.filter((c) => c.endDate < today)
  const upcomingCycles = cycles.filter((c) => c.endDate >= today)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a pay period" />
      </SelectTrigger>
      <SelectContent>
        {pastCycles.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-slate-500 font-semibold">Past Pay Periods</SelectLabel>
            {pastCycles.map((cycle) => (
              <SelectItem key={cycle.startDate} value={cycle.startDate}>
                {cycle.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {upcomingCycles.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-slate-500 font-semibold">Upcoming Pay Periods</SelectLabel>
            {upcomingCycles.map((cycle) => (
              <SelectItem key={cycle.startDate} value={cycle.startDate}>
                {cycle.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}
