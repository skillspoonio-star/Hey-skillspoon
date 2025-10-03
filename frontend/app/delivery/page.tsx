"use client"

import { useRouter } from "next/navigation"

export default function DeliveryStartPage() {
  const router = useRouter()

  if (typeof window !== "undefined") {
    router.push("/delivery/menu")
  }

  return null
}
