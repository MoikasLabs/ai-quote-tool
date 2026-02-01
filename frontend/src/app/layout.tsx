import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 3D Print Quote Calculator - Moikas',
  description:
    'Get instant, accurate quotes for your 3D printing projects. Conversational AI helps you estimate costs based on material, size, and finish.',
  keywords: [
    '3D printing',
    'quote calculator',
    'PLA',
    'PETG',
    'TPU',
    'printing cost',
    'instant quote',
  ],
  authors: [{ name: 'Moikas 3D Printing Service' }],
  openGraph: {
    title: 'AI 3D Print Quote Calculator',
    description: 'Get instant quotes for your 3D printing projects',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
