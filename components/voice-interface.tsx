"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type SpeechRecognition from "speech-recognition"
import { useOrderManager } from "@/hooks/use-order-manager" // Fixed import path to use correct hook file

interface VoiceInterfaceProps {
  onOrderUpdate: (order: any) => void
  orders: any[]
}

type VoiceState = "idle" | "listening" | "processing" | "speaking"

export function VoiceInterface({ onOrderUpdate, orders }: VoiceInterfaceProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const { addOrder } = useOrderManager()

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const speechSynthesis = window.speechSynthesis

      if (SpeechRecognition && speechSynthesis) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()
        synthRef.current = speechSynthesis

        // Configure speech recognition
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-IN"

        recognitionRef.current.onstart = () => {
          setVoiceState("listening")
          setTranscript("")
        }

        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex
          const transcript = event.results[current][0].transcript
          setTranscript(transcript)

          if (event.results[current].isFinal) {
            processVoiceCommand(transcript)
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setVoiceState("idle")
        }

        recognitionRef.current.onend = () => {
          if (voiceState === "listening") {
            setVoiceState("idle")
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [voiceState])

  const startListening = () => {
    if (recognitionRef.current && voiceState === "idle") {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && voiceState === "listening") {
      recognitionRef.current.stop()
      setVoiceState("idle")
    }
  }

  const processVoiceCommand = async (command: string) => {
    setVoiceState("processing")

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simple command processing (in real app, this would use NLP/AI)
    const lowerCommand = command.toLowerCase()
    let responseText = ""
    let newOrder = null

    if (lowerCommand.includes("hey paytm") || lowerCommand.includes("order")) {
      // Extract food items (simplified logic)
      if (lowerCommand.includes("butter naan")) {
        const quantity = extractQuantity(lowerCommand, "butter naan")
        newOrder = { id: Date.now(), item: "Butter Naan", quantity, price: 45 }
        responseText = `Added ${quantity} Butter Naan to your order. Anything else?`
      } else if (lowerCommand.includes("paneer tikka")) {
        const quantity = extractQuantity(lowerCommand, "paneer tikka")
        newOrder = { id: Date.now(), item: "Paneer Tikka", quantity, price: 280 }
        responseText = `Added ${quantity} Paneer Tikka to your order. Anything else?`
      } else if (lowerCommand.includes("mango lassi")) {
        const quantity = extractQuantity(lowerCommand, "mango lassi")
        newOrder = { id: Date.now(), item: "Mango Lassi", quantity, price: 120 }
        responseText = `Added ${quantity} Mango Lassi to your order. Anything else?`
      } else if (
        lowerCommand.includes("done") ||
        lowerCommand.includes("finish") ||
        lowerCommand.includes("complete")
      ) {
        if (orders.length > 0) {
          const tableNumber = 12 // In real app, this would be dynamic
          addOrder(tableNumber, orders)
          responseText =
            "Perfect! Your order has been sent to the kitchen. You can track its progress in the Order tab."
        } else {
          responseText = "You haven't ordered anything yet. Please add some items first."
        }
      } else {
        responseText = "I didn't catch that. Please try saying 'Hey Paytm, order 2 butter naan' or similar."
      }
    } else {
      responseText = "Please start with 'Hey Paytm' to place an order."
    }

    setResponse(responseText)

    if (newOrder) {
      onOrderUpdate(newOrder)
    }

    // Speak the response
    speakResponse(responseText)
  }

  const extractQuantity = (command: string, item: string): number => {
    const numbers = command.match(/\d+/)
    return numbers ? Number.parseInt(numbers[0]) : 1
  }

  const speakResponse = (text: string) => {
    if (synthRef.current) {
      setVoiceState("speaking")
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onend = () => {
        setVoiceState("idle")
      }

      synthRef.current.speak(utterance)
    } else {
      setVoiceState("idle")
    }
  }

  if (!isSupported) {
    return (
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Voice recognition is not supported in your browser.</p>
          <p className="text-sm text-muted-foreground mt-2">Please use Chrome or Safari for the best experience.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Voice Status */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <Badge variant={voiceState === "idle" ? "secondary" : "default"} className="mb-2">
              {voiceState === "idle" && "Ready to listen"}
              {voiceState === "listening" && "Listening..."}
              {voiceState === "processing" && "Processing..."}
              {voiceState === "speaking" && "Speaking..."}
            </Badge>
          </div>

          {/* Voice Animation */}
          <div className="relative mb-6">
            <div
              className={cn(
                "w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300",
                voiceState === "idle" && "bg-muted",
                voiceState === "listening" && "bg-primary",
                voiceState === "processing" && "bg-secondary",
                voiceState === "speaking" && "bg-accent",
              )}
            >
              {voiceState === "listening" && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary opacity-20 pulse-ring"></div>
                  <div className="absolute inset-2 rounded-full bg-primary opacity-40 pulse-ring"></div>
                </>
              )}

              {voiceState === "processing" ? (
                <Loader2 className="w-8 h-8 text-secondary-foreground animate-spin" />
              ) : voiceState === "speaking" ? (
                <Volume2 className="w-8 h-8 text-accent-foreground" />
              ) : voiceState === "listening" ? (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 h-6 bg-primary-foreground rounded-full voice-wave"></div>
                  ))}
                </div>
              ) : (
                <Mic className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Voice Control Button */}
          <Button
            size="lg"
            onClick={voiceState === "listening" ? stopListening : startListening}
            disabled={voiceState === "processing" || voiceState === "speaking"}
            className="w-full"
          >
            {voiceState === "listening" ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Say "Hey Paytm"
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-sm text-muted-foreground">You said:</h3>
            <p className="text-foreground">{transcript}</p>
          </CardContent>
        </Card>
      )}

      {/* Response Display */}
      {response && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Hey Paytm:</h3>
            <p className="text-foreground">{response}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Commands */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Try saying:</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>"Hey Paytm, order 2 butter naan"</p>
            <p>"Hey Paytm, add 1 paneer tikka"</p>
            <p>"Hey Paytm, order mango lassi"</p>
            <p>"Hey Paytm, I'm done ordering"</p>
          </div>
        </CardContent>
      </Card>

      {/* Current Order Summary */}
      {orders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Current Order:</h3>
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex justify-between items-center text-sm">
                  <span>
                    {order.quantity}x {order.item}
                  </span>
                  <span className="font-medium">₹{order.price * order.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-3">
              <div className="flex justify-between items-center font-semibold">
                <span>Total:</span>
                <span>₹{orders.reduce((sum, order) => sum + order.price * order.quantity, 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
