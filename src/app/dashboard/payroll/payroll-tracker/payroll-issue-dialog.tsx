'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { authFetch } from '@/lib/api-client'
import { generatePayrollCycles, detectCurrentCycle } from '@/lib/payroll-cycles'
import { useQueryClient } from '@tanstack/react-query'
import { PayrollTrackerIssue, PayrollTrackerAttachment } from '@/hooks/use-payroll-tracker'
import { X } from 'lucide-react'

interface PayrollIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  issue?: PayrollTrackerIssue
}

const ISSUE_TYPES = [
  { value: 'garnishment', label: 'Garnishment' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'expense', label: 'Expense' },
  { value: 'payroll_correction', label: 'Payroll Correction' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'other', label: 'Other' },
]

const DEFAULT_DIRECTION_BY_TYPE: Record<string, 'owe_employee' | 'employee_owes'> = {
  garnishment: 'employee_owes',
  deduction: 'employee_owes',
  expense: 'owe_employee',
  payroll_correction: 'owe_employee',
  bonus: 'owe_employee',
  other: 'owe_employee',
}

export function PayrollIssueDialog({
  open,
  onOpenChange,
  onSuccess,
  issue,
}: PayrollIssueDialogProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [formData, setFormData] = useState({
    employee_name: '',
    salary: '',
    type: '' as string,
    direction: 'owe_employee' as 'owe_employee' | 'employee_owes',
    amount: '',
    pay_period_start: '',
    notes: '',
    is_recurring: false,
  })
  const [attachments, setAttachments] = useState<PayrollTrackerAttachment[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const cycles = useMemo(() => generatePayrollCycles(today), [today])
  const isEditMode = !!issue

  const selectedCycle = useMemo(
    () => cycles.find(c => c.startDate === formData.pay_period_start) ?? null,
    [cycles, formData.pay_period_start]
  )

  useEffect(() => {
    if (open) {
      if (issue) {
        // Edit mode: pre-populate form
        setFormData({
          employee_name: issue.employee_name,
          salary: issue.salary ? String(issue.salary) : '',
          type: issue.type,
          direction: issue.direction,
          amount: String(issue.amount),
          pay_period_start: issue.pay_period_start,
          notes: issue.notes,
          is_recurring: issue.is_recurring,
        })
        setAttachments(issue.attachments ?? [])
      } else {
        // Create mode: reset and set default cycle
        const defaultStart = detectCurrentCycle(cycles, today)
        setFormData(f => ({ ...f, pay_period_start: defaultStart }))
        setAttachments([])
      }
      setPendingFiles([])
    }
  }, [open, issue, cycles, today])

  const uploadFile = async (file: File, issueId: string) => {
    const formData = new FormData()
    formData.append('issue_id', issueId)
    formData.append('file', file)

    const response = await authFetch('/api/finance/payroll-tracker/attachments', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload file')
    }
    return data.attachment
  }

  const deleteAttachment = async (attachmentId: string) => {
    const response = await authFetch(`/api/finance/payroll-tracker/attachments/${attachmentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete attachment')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      if (isEditMode && issue) {
        // In edit mode, upload immediately
        setUploadingFile(true)
        Promise.all(files.map(f => uploadFile(f, issue.id)))
          .then(newAttachments => {
            setAttachments(prev => [...prev, ...newAttachments])
            toast.success(`${files.length} file(s) uploaded`)
          })
          .catch(error => {
            console.error('Upload error:', error)
            toast.error('Failed to upload file(s)')
          })
          .finally(() => setUploadingFile(false))
      } else {
        // In create mode, hold files for later upload
        setPendingFiles(prev => [...prev, ...files])
        toast.success(`${files.length} file(s) selected`)
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId)
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      toast.success('Attachment deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete attachment')
    }
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    // Validation
    if (!formData.employee_name.trim()) {
      toast.error('Employee name is required')
      return
    }
    if (!formData.type) {
      toast.error('Issue type is required')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    if (!formData.pay_period_start) {
      toast.error('Pay period is required')
      return
    }
    if (!formData.notes.trim() || formData.notes.trim().length < 100) {
      toast.error('Notes must be at least 100 characters')
      return
    }

    if (!selectedCycle) {
      toast.error('Invalid pay period selected')
      return
    }

    setLoading(true)
    try {
      if (isEditMode && issue) {
        // Edit mode: PATCH request
        const response = await authFetch(`/api/finance/payroll-tracker/${issue.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_name: formData.employee_name.trim(),
            salary: formData.salary ? parseFloat(formData.salary) : null,
            type: formData.type,
            direction: formData.direction,
            amount: parseFloat(formData.amount),
            pay_period_start: selectedCycle.startDate,
            pay_period_end: selectedCycle.endDate,
            pay_period_label: selectedCycle.label,
            notes: formData.notes.trim(),
            is_recurring: formData.is_recurring,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          toast.error(data.error || 'Failed to update issue')
          return
        }

        toast.success('Issue updated successfully')
      } else {
        // Create mode: POST request
        const response = await authFetch('/api/finance/payroll-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_name: formData.employee_name.trim(),
            salary: formData.salary ? parseFloat(formData.salary) : null,
            type: formData.type,
            direction: formData.direction,
            amount: parseFloat(formData.amount),
            pay_period_start: selectedCycle.startDate,
            pay_period_end: selectedCycle.endDate,
            pay_period_label: selectedCycle.label,
            notes: formData.notes.trim(),
            is_recurring: formData.is_recurring,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          toast.error(data.error || 'Failed to log issue')
          return
        }

        // Upload pending files if any
        if (pendingFiles.length > 0) {
          try {
            await Promise.all(pendingFiles.map(f => uploadFile(f, data.issue.id)))
            toast.success('Issue logged successfully with attachments')
          } catch (error) {
            console.error('File upload error:', error)
            toast.warning('Issue logged but some files failed to upload')
          }
        } else {
          toast.success('Issue logged successfully')
        }
      }

      onSuccess()
      onOpenChange(false)
      setFormData({
        employee_name: '',
        salary: '',
        type: '',
        direction: 'owe_employee',
        amount: '',
        pay_period_start: '',
        notes: '',
        is_recurring: false,
      })
      setAttachments([])
      setPendingFiles([])
      queryClient.invalidateQueries({ queryKey: ['payroll-tracker-issues'] })
    } catch (error) {
      console.error('Error saving issue:', error)
      toast.error('Failed to save issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Payroll Issue' : 'Log Payroll Issue'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the payroll issue details.'
              : 'Document a payroll issue that needs to be addressed.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee-name">Employee Name *</Label>
            <Input
              id="employee-name"
              placeholder="Enter employee name"
              value={formData.employee_name}
              onChange={e => setFormData(f => ({ ...f, employee_name: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salary (Optional)</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              placeholder="Optional salary amount"
              value={formData.salary}
              onChange={e => setFormData(f => ({ ...f, salary: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Issue Type *</Label>
            <Select
              value={formData.type}
              onValueChange={v => setFormData(f => ({
                ...f,
                type: v,
                direction: DEFAULT_DIRECTION_BY_TYPE[v] ?? 'owe_employee',
              }))}
              disabled={loading}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Direction *</Label>
            <RadioGroup
              value={formData.direction}
              onValueChange={v =>
                setFormData(f => ({ ...f, direction: v as 'owe_employee' | 'employee_owes' }))
              }
              className="flex gap-4"
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="owe_employee" id="dir-owe-employee" />
                <Label htmlFor="dir-owe-employee" className="font-normal cursor-pointer">
                  XA owes employee
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee_owes" id="dir-employee-owes" />
                <Label htmlFor="dir-employee-owes" className="font-normal cursor-pointer">
                  Employee owes XA
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-500">
              {formData.direction === 'owe_employee'
                ? 'This amount will be added to what XA owes the employee (bonus, expense, etc.)'
                : 'This amount will be deducted from what is owed to the employee (garnishment, deduction, etc.)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-period">Pay Period *</Label>
            <Select
              value={formData.pay_period_start}
              onValueChange={v => setFormData(f => ({ ...f, pay_period_start: v }))}
              disabled={loading}
            >
              <SelectTrigger id="pay-period">
                <SelectValue placeholder="Select pay period" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map(cycle => (
                  <SelectItem key={cycle.startDate} value={cycle.startDate}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes * (minimum 100 characters)</Label>
            <Textarea
              id="notes"
              placeholder="Describe the payroll issue in detail..."
              rows={4}
              value={formData.notes}
              onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              {formData.notes.length} / 100 characters
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Switch
              id="is-recurring"
              checked={formData.is_recurring}
              onCheckedChange={checked => setFormData(f => ({ ...f, is_recurring: checked }))}
              disabled={loading}
            />
            <Label htmlFor="is-recurring" className="cursor-pointer flex-1 mb-0">
              <span className="font-medium">Recurring Issue</span>
              <p className="text-xs text-gray-600 font-normal">
                Automatically rolls over to the next pay period until resolved
              </p>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Optional)</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="attachments"
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={loading || uploadingFile}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-500">
              Attach supporting documents (pay stubs, correction evidence, etc.)
            </p>

            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-gray-700">Uploaded Files:</p>
                <div className="space-y-1">
                  {attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between gap-2 rounded bg-gray-50 px-2 py-1.5 text-sm"
                    >
                      <span className="truncate text-gray-700">{attachment.file_name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                        disabled={loading || uploadingFile}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-gray-700">Ready to Upload:</p>
                <div className="space-y-1">
                  {pendingFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded bg-blue-50 px-2 py-1.5 text-sm"
                    >
                      <span className="truncate text-blue-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingFile(idx)}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading
              ? isEditMode
                ? 'Updating...'
                : 'Logging...'
              : isEditMode
                ? 'Update Issue'
                : 'Log Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
