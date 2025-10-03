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
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4", className)}>
      <div className="min-w-0">
        <h2 className="font-sans font-semibold text-xl text-foreground text-pretty tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        <div className="h-2">
          <span className="inline-block h-[2px] w-14 rounded-full bg-primary/70" aria-hidden="true" />
        </div>
      </div>
      {right ? <div className="flex-shrink-0">{right}</div> : null}
    </div>
  )
}
