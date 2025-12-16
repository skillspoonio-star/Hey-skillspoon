"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DeliveryStartPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/delivery/menu")
  }, [router])

  return null
}
