'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PhoneVerifyModal } from '@/components/secure/PhoneVerifyModal'
import { EmployeeProfile } from '@/components/secure/EmployeeProfile'
import { PayPeriodSelector } from '@/components/secure/PayPeriodSelector'
import { PayrollTable } from '@/components/secure/PayrollTable'
import { Button } from '@/components/ui/button'
import { generatePayrollCycles, detectCurrentCycle } from '@/lib/payroll-cycles'
import { Download, Loader2 } from 'lucide-react'

interface EmployeeData {
  humanity_id: string
  eid: string
  name: string
  email: string
  avatar?: string | null
  phone: string
}

interface PayrollEntry {
  date: {
    formatted: string
    timestamp: number
  }
  start_time: string
  end_time: string
  shift_title?: string
  hours: {
    regular: number
    special: number
    overtime: number
    total: number
    cost: number
    breaks: number
    rate: number | null
    position: { name: string }
    location: { name: string }
    ratecard?: { name: string } | null
  }
  in_location_name: string
  out_location_name: string
}

interface PayrollReportClientProps {
  isAuthenticated: boolean
}

export function PayrollReportClient({ isAuthenticated }: PayrollReportClientProps) {
  const router = useRouter()
  const [selectedCycleStart, setSelectedCycleStart] = useState<string>('')
  const [selectedCycleEnd, setSelectedCycleEnd] = useState<string>('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Set initial cycle on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cycles = generatePayrollCycles(today)
    const currentStart = detectCurrentCycle(cycles, today)
    const currentCycle = cycles.find((c) => c.startDate === currentStart)

    if (currentCycle) {
      setSelectedCycleStart(currentCycle.startDate)
      setSelectedCycleEnd(currentCycle.endDate)
    }
  }, [])

  // Fetch employee profile
  const {
    data: employee,
    isLoading: employeeLoading,
    error: employeeError,
  } = useQuery<EmployeeData>({
    queryKey: ['employee'],
    queryFn: async () => {
      const response = await fetch('/api/secure/employee')
      if (!response.ok) {
        throw new Error('Failed to fetch employee profile')
      }
      return response.json()
    },
    enabled: isAuthenticated,
  })

  // Fetch payroll entries
  const {
    data: payrollData,
    isLoading: payrollLoading,
    error: payrollError,
  } = useQuery<{ entries: PayrollEntry[] }>({
    queryKey: ['payroll', selectedCycleStart, selectedCycleEnd],
    queryFn: async () => {
      const response = await fetch(
        `/api/secure/payroll-report?startDate=${selectedCycleStart}&endDate=${selectedCycleEnd}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch payroll report')
      }
      return response.json()
    },
    enabled: isAuthenticated && !!selectedCycleStart && !!selectedCycleEnd,
  })

  const handlePeriodChange = (startDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    const cycles = generatePayrollCycles(today)
    const cycle = cycles.find((c) => c.startDate === startDate)

    if (cycle) {
      setSelectedCycleStart(cycle.startDate)
      setSelectedCycleEnd(cycle.endDate)
    }
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const response = await fetch(
        `/api/secure/payroll-report/pdf?startDate=${selectedCycleStart}&endDate=${selectedCycleEnd}`
      )

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payroll-${selectedCycleStart}-to-${selectedCycleEnd}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (!isAuthenticated) {
    return <PhoneVerifyModal open={true} onSuccess={() => router.refresh()} />
  }

  return (
    <div className="space-y-6">
      {/* Employee Profile */}
      <EmployeeProfile isLoading={employeeLoading} data={employee} />

      {/* Pay Period Selector and Actions */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 block mb-2">Select Pay Period</label>
            <PayPeriodSelector
              value={selectedCycleStart}
              onChange={handlePeriodChange}
              disabled={!isAuthenticated}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || payrollLoading}
              className="w-full"
              size="lg"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <PayrollTable
        isLoading={payrollLoading}
        entries={payrollData?.entries}
        error={employeeError?.message || payrollError?.message}
      />
    </div>
  )
}
