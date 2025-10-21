export interface SimpleTable {
    number: number
    capacity: number
}

/**
 * Fetch available tables from backend.
 * - Calls GET /api/tables/available
 * - Optional `at` should be an ISO datetime string (e.g. 2025-10-10T19:00)
 * - Optional `duration` in minutes
 */
export async function fetchAvailableTables(): Promise<SimpleTable[]> {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
    const url = `${base}/api/tables/available`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch tables : ${res.status}`)
    return res.json()
}
export async function fetchAvailableTablesByTime(
  date: string,
  time: string
): Promise<SimpleTable[]> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
  const url = `${base}/api/tables/available`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ date, time })
  })

  if (!res.ok) throw new Error(`Failed to fetch tables: ${res.status}`)

  return res.json()
}

