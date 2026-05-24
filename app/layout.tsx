import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import SessionWrapper from '@/components/SessionWrapper'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ledger — Personal Finance',
  description: 'Personal finance tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-gray-950">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
