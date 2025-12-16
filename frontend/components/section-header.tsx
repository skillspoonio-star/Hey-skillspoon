"use client"

import type React from "react"

import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  subtitle?: string
  right?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, right, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "w-full px-4 sm:px-6 md:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-semibold text-xl text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

        <div className="h-2">
          <span className="inline-block h-[2px] w-14 rounded-full bg-primary/70" />
        </div>
      </div>

      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

