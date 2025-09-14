import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pathfinder Manager',
  description: 'Pathfinder Character Manager and Session Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
