"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, ArrowLeft } from "lucide-react"
import { menuItems } from "@/lib/menu-data"

type Review = {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: string
}

export default function ItemReviewsPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const item = useMemo(() => menuItems.find((m) => m.id === id), [id])

  const [reviews, setReviews] = useState<Review[]>([])
  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [canReview, setCanReview] = useState(false)

  useEffect(() => {
    if (!item) return
    // Load existing reviews
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`reviews:${id}`)
      if (saved) setReviews(JSON.parse(saved))

      // Gate: only allow post if purchased
      const purchasedIds = JSON.parse(localStorage.getItem("purchasedItemIds") || "[]") as number[]
      const purchasedNames = JSON.parse(localStorage.getItem("purchasedItemNames") || "[]") as string[]
      setCanReview(purchasedIds.includes(id) || (item?.name ? purchasedNames.includes(item.name) : false))
    }
  }, [id, item])

  const saveReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !rating || !comment) return
    const newReview: Review = {
      id: Math.random().toString(36).slice(2),
      name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    }
    const next = [newReview, ...reviews]
    setReviews(next)
    if (typeof window !== "undefined") {
      localStorage.setItem(`reviews:${id}`, JSON.stringify(next))
    }
    setName("")
    setRating(5)
    setComment("")
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="mt-4">Item not found.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-sans font-bold text-xl text-foreground">{item.name} Reviews</h1>
            <p className="text-sm text-muted-foreground">Read and share your experience</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.length === 0 && (
              <div className="text-muted-foreground text-sm">No reviews yet. Be the first to review.</div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.name}</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                <p className="text-sm mt-2 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            {!canReview && (
              <div className="text-sm text-muted-foreground mb-3">
                You can post a review after your bill is confirmed for this dish. You can still read reviews above.
              </div>
            )}
            <form onSubmit={saveReview} className="space-y-4">
              <div>
                <Label>Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label>Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={rating === n ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => setRating(n)}
                    >
                      <Star className={`w-3 h-3 ${rating >= n ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      <span className="ml-1">{n}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Comment</Label>
                <Textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about taste, portion, etc."
                />
              </div>
              <Button type="submit" disabled={!canReview}>
                Submit Review
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
