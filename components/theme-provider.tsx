"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme as useNextTheme } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} {...props}>
      {children}
    </NextThemesProvider>
  )
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  const effective = (theme === "system" ? resolvedTheme : theme) as "light" | "dark" | undefined

  const toggle = React.useCallback(() => {
    setTheme(effective === "dark" ? "light" : "dark")
  }, [effective, setTheme])

  return { theme: effective, setTheme, toggle }
}
