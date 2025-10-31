"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"

  // ✅ Add a mounted flag to ensure rendering only after hydration
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Avoid rendering before the theme is known (prevents mismatch)
    return (
      <Button variant="outline" size="icon" className={className} aria-label="Toggle theme">
        {/* placeholder, keeps layout consistent */}
        <div className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggle}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
    </Button>
  )
}
