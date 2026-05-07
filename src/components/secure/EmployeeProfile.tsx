'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface EmployeeProfileProps {
  isLoading?: boolean
  data?: {
    name: string
    eid: string
    email: string
    avatar?: string | null
    phone?: string | null
    cell_phone?: string | null
  } | null
}

export function EmployeeProfile({ isLoading, data }: EmployeeProfileProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const initials = data.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Avatar and name */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {data.avatar && (
                <AvatarImage
                  src={data.avatar}
                  alt={data.name}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900">{data.name}</h2>
              <p className="text-sm text-slate-600">{data.email}</p>
              {(data.phone || data.cell_phone) && (
                <p className="text-sm text-slate-500 mt-1">{data.phone || data.cell_phone}</p>
              )}
            </div>
          </div>

          {/* EID badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Employee ID:</span>
            <Badge variant="secondary">{data.eid}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
