"use client"

import React, { useEffect, useMemo, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Users } from "lucide-react"
import { format } from "date-fns"

type Table = { id: number; capacity: number; reservationPrice?: number }

const TIME_OPTIONS = [
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
]

export default function AdminNewReservationPage() {
  // Compute tomorrow's date in YYYY-MM-DD so today is not selectable
  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return format(d, 'yyyy-MM-dd')
  }, [])

  const dateRef = useRef<HTMLInputElement | null>(null)

  const openPicker = () => {
    const input = dateRef.current
    if (!input) return
    if (typeof (input as any).showPicker === 'function') {
      ;(input as any).showPicker()
    } else {
      input.focus()
    }
  }

  const [date, setDate] = useState<string>("")
  const [time, setTime] = useState<string>("")

  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [tablesError, setTablesError] = useState<string | null>(null)

  const [selectedTables, setSelectedTables] = useState<number[]>([])

  // Customer details (initially empty as requested)
  const [customerName, setCustomerName] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [occasion, setOccasion] = useState<string>("")
  const [specialRequests, setSpecialRequests] = useState<string>("")

  // Guests auto-filled from selected tables' capacities (read-only)
  const guests = useMemo(() => {
    return selectedTables.reduce((s, id) => {
      const t = availableTables.find((x) => x.id === id)
      return s + (t ? Number(t.capacity || 0) : 0)
    }, 0)
  }, [selectedTables, availableTables])

  // Session default
  const [sessionMinutes, setSessionMinutes] = useState<number>(60)

  // Fetch available tables when date+time change
  useEffect(() => {
    let mounted = true
    const fetchAvail = async () => {
      if (!date || !time) return
      setLoadingTables(true)
      setTablesError(null)
      try {
        const q = new URLSearchParams({ date, time, duration: String(sessionMinutes) })
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/tables/available?${q.toString()}`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        if (!mounted) return
        setAvailableTables(Array.isArray(data) ? data.map((d: any) => ({ id: d.number ?? d.id, capacity: d.capacity ?? 0, reservationPrice: typeof d.reservationPrice !== 'undefined' ? Number(d.reservationPrice) : 0 })) : [])
      } catch (err: any) {
        if (!mounted) return
        setTablesError(err?.message || 'Failed to fetch tables')
        setAvailableTables([])
      } finally {
        if (mounted) setLoadingTables(false)
      }
    }
    fetchAvail()
    return () => { mounted = false }
  }, [date, time, sessionMinutes])

  const to12Hour = (hhmm: string) => {
    const [hh, mm] = hhmm.split(':').map(Number)
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return hhmm
    const period = hh >= 12 ? 'PM' : 'AM'
    const h12 = hh % 12 === 0 ? 12 : hh % 12
    return `${h12}:${String(mm).padStart(2, '0')} ${period}`
  }

  const submitReservation = async () => {
    if (!date || !time || !selectedTables.length) return alert('Choose date/time and table(s)')
    const payload = {
      customerName,
      phone,
      email,
      date,
      time,
      guests,
      tableNumbers: selectedTables,
      sessionMinutes,
      occasion: occasion || null,
      specialRequests: specialRequests || null,
    }
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      const res = await fetch(`${base}/api/reservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        alert('Reservation created successfully')
        // reset form
        setSelectedTables([])
        setCustomerName('')
        setPhone('')
        setEmail('')
      } else if (res.status === 409) {
        const d = await res.json().catch(() => ({}))
        alert(d.message || 'Some selected tables are no longer available')
      } else {
        const d = await res.json().catch(() => ({}))
        alert(d.message || `Failed to create reservation (status ${res.status})`)
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Network error')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="max-w-2xl mx-auto mb-6">
        <h1 className="text-2xl font-bold">Create reservation (Admin)</h1>
        <p className="text-sm text-muted-foreground">Select date & time, pick table(s), enter customer details, then create reservation.</p>
      </header>

      <main className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Select date, time & session
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-1/2">
              <Label htmlFor="date">Date</Label>
              <input
                id="date"
                ref={dateRef}
                type="date"
                className="w-full border rounded-md px-3 py-2 mt-1 cursor-pointer"
                value={date}
                min={tomorrow}
                onClick={openPicker}
                onChange={(e) => {
                  setDate(e.target.value)
                  setTime('')
                  setSelectedTables([])
                }}
              />

            </div>

            <div className="w-full sm:w-1/2">
              <Label htmlFor="time">Time</Label>
              <select id="time" className="w-full border rounded-md px-3 py-2 mt-1 bg-card text-foreground" value={time} onChange={(e) => { setTime(e.target.value); setSelectedTables([]) }} disabled={!date}>
                <option value="">-- choose time --</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{to12Hour(t)}</option>)}
              </select>
            </div>

            <div className="w-full sm:w-1/4">
              <Label htmlFor="sessionPicker">Session (mins)</Label>
              <select id="sessionPicker" value={sessionMinutes} onChange={(e) => { setSessionMinutes(Number(e.target.value)); setSelectedTables([]) }} className="w-full border rounded-md px-3 py-2 mt-1 bg-card text-foreground ">
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value={60}>60</option>
                <option value={90}>90</option>
                <option value={120}>120</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Available tables (visible after date+time) */}
        {date && time && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Available tables</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTables ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : tablesError ? (
                <div className="text-sm text-destructive">{tablesError}</div>
              ) : availableTables.length ? (
                <ul className="space-y-3">
                  {availableTables.map((t) => {
                    const isSelected = selectedTables.includes(t.id)
                    return (
                      <li key={t.id} className={`flex items-center justify-between p-3 rounded-md border ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                        <div>
                          <div className="font-medium">Table {t.id}</div>
                          <div className="text-sm text-muted-foreground">{t.capacity}-person capacity</div>
                          <div className="text-sm text-muted-foreground">Price: {typeof t.reservationPrice !== 'undefined' ? t.reservationPrice : '0'}</div>
                        </div>
                        <div>
                          <Button size="sm" variant={isSelected ? 'default' : 'outline'} onClick={() => setSelectedTables((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))}>
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">No tables available for the selected slot.</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Customer details: only show after at least one table selected */}
        {selectedTables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Customer details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customerName">Customer name</Label>
                  <input id="customerName" placeholder="Full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <input id="phone" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\\D/g, "").slice(0, 10))} className="w-full border rounded-md px-3 py-2 mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <input id="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1" />
                </div>

                <div>
                  <Label htmlFor="occasion">Occasion</Label>
                  <input id="occasion" placeholder="Birthday" value={occasion} onChange={(e) => setOccasion(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1" />
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special requests</Label>
                  <input id="specialRequests" placeholder="Need celebrating arrangement" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1" />
                </div>

                <div>
                  <Label>Selected tables</Label>
                  <div className="w-full border rounded-md px-3 py-2 mt-1">{selectedTables.join(', ')}</div>
                </div>

                <div>
                  <Label>Guests</Label>
                  <div className="w-full border rounded-md px-3 py-2 mt-1">{guests}</div>
                </div>

                <div>
                  <Label>Session minutes</Label>
                  <div className="w-full border rounded-md px-3 py-2 mt-1">{sessionMinutes}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button onClick={submitReservation}>Create reservation</Button>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}
