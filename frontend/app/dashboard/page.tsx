"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardIndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Replace the dashboard root with the home subpage
    router.replace("/dashboard/home")
  }, [router])

  return null
}
