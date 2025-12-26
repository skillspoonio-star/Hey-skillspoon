"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function OrdersRedirectPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Get table parameter if it exists
        const table = searchParams.get('table')

        // Redirect to the correct live orders page
        if (table) {
            router.replace(`/dashboard/home?table=${table}`)
        } else {
            router.replace('/dashboard/home')
        }
    }, [router, searchParams])

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Redirecting to Live Orders...</p>
            </div>
        </div>
    )
}