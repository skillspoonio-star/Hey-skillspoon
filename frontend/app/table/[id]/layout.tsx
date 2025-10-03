import type React from "react"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tableNumber = params.id

  return {
    title: `Table ${tableNumber} - Hey Paytm Voice Dining`,
    description: `Order from Table ${tableNumber} using voice commands and browse our menu`,
  }
}

export default function TableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
