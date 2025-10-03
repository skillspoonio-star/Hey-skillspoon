"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Clock, Users, Phone } from "lucide-react"
import { format } from "date-fns"

export default function ReservationConfirmationPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("latestReservation")
      if (raw) setData(JSON.parse(raw))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Reservation Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(data.date), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{data.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {data.guests} {data.guests === "1" ? "Guest" : "Guests"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{data.phone}</span>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Reservation ID</div>
                    <div className="font-medium">{data.id}</div>
                  </div>
                </div>
                {data.special && (
                  <div className="text-sm text-muted-foreground">
                    Special Requests: <span className="text-foreground">{data.special}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => router.push("/restaurant-info/menu")}>View Menu</Button>
                  <Button variant="outline" className="bg-transparent" onClick={() => router.push("/restaurant-info")}>
                    Restaurant Info
                  </Button>
                </div>
              </>
            ) : (
              <div>No reservation found.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
