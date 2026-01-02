"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function TableOrdersRedirectPage() {
    const router = useRouter()
    const params = useParams()

    useEffect(() => {
        // Get table ID from params
        const tableId = params.id

        // Redirect to the correct live orders page with table filter
        if (tableId) {
            router.replace(`/dashboard/home?table=${tableId}`)
        } else {
            router.replace('/dashboard/home')
        }
    }, [router, params])

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Redirecting to Table Orders...</p>
            </div>
        </div>
    )
}