import type React from 'react'
import Image from 'next/image'

export default function SecureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Image
            src="/Logos/Main Logo/PNG/72 ppi/XA_Logo-Black.png"
            alt="XA Security"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Employee Self-Service Portal</h1>
            <p className="text-xs text-slate-500">View your payroll and download reports</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500">
        <p>© XA Security Group. Confidential.</p>
      </footer>
    </div>
  )
}
