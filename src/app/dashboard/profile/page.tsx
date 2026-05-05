'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BreadcrumbProvider, useBreadcrumbs } from '@/components/breadcrumb-context'
import { Loader2 } from 'lucide-react'

function ProfileContent() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatar, setAvatar] = useState(user?.avatar_url || '')
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    nickname: user?.nickname || '',
    title: user?.title || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { setBreadcrumbs } = useBreadcrumbs()

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile' },
    ])
  }, [setBreadcrumbs])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/profile/me/avatar?userId=${user.id}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const { url } = await response.json()
      setAvatar(url)

      // Update user profile with new avatar URL
      await fetch(`/api/profile/me?userId=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      })

      window.dispatchEvent(new Event('user-updated'))
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/profile/me?userId=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          nickname: formData.nickname,
          title: formData.title,
          phone: formData.phone,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      window.dispatchEvent(new Event('user-updated'))
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and profile picture</p>
      </div>

      <div className="bg-white rounded-lg border border-border p-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8 pb-8 border-b border-border">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Profile avatar"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-3xl font-semibold">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
          >
            {isUploadingAvatar ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload Photo
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* First Name + Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium mb-2">Nickname (Optional)</label>
            <Input
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="Nickname"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your nickname will be displayed instead of your name if set
            </p>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Job Title (Optional)</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Job title"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              name="email"
              value={formData.email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone number"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Phone number will be stored in E.164 format
            </p>
          </div>

          {/* Permission Groups */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Permission Groups</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage your access level and permissions
                </p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage
              </button>
            </div>
            <div className="mt-4 text-sm">
              <span className="inline-block px-3 py-1 bg-muted rounded-md">
                {user?.role || 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <BreadcrumbProvider>
      <ProfileContent />
    </BreadcrumbProvider>
  )
}
