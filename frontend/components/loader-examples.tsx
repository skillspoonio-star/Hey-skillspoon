/**
 * Loader Component Usage Examples
 * 
 * This file demonstrates all the ways to use the loader components
 * in your Hey Paytm application.
 */

import { Loader, FullPageLoader, PageLoader, InlineLoader } from "@/components/ui/loader"

// Example 1: Basic Loader with different sizes
export function BasicLoaderExample() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h3 className="mb-4">Small Loader</h3>
        <Loader size="sm" />
      </div>
      
      <div>
        <h3 className="mb-4">Medium Loader (default)</h3>
        <Loader size="md" />
      </div>
      
      <div>
        <h3 className="mb-4">Large Loader</h3>
        <Loader size="lg" />
      </div>
      
      <div>
        <h3 className="mb-4">Extra Large Loader</h3>
        <Loader size="xl" />
      </div>
    </div>
  )
}

// Example 2: Loader with text
export function LoaderWithTextExample() {
  return (
    <div className="space-y-8 p-8">
      <Loader size="md" text="Loading menu items..." />
      <Loader size="lg" text="Processing payment..." />
    </div>
  )
}

// Example 3: Full Page Loader (blocks entire screen)
export function FullPageLoaderExample() {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsProcessing(false)
  }
  
  return (
    <>
      <button onClick={handlePayment}>Process Payment</button>
      {isProcessing && <FullPageLoader text="Processing your payment..." />}
    </>
  )
}

// Example 4: Page Loader (for Next.js loading.tsx files)
export function PageLoaderExample() {
  return <PageLoader text="Loading dashboard..." />
}

// Example 5: Inline Loader (for loading states within components)
export function InlineLoaderExample() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetchData().then(result => {
      setData(result)
      setIsLoading(false)
    })
  }, [])
  
  return (
    <div>
      <h2>Order History</h2>
      {isLoading ? (
        <InlineLoader text="Loading orders..." size="md" />
      ) : (
        <div>{/* Render data */}</div>
      )}
    </div>
  )
}

// Example 6: Conditional Loading in a form
export function FormLoadingExample() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Submit form
    await submitForm()
    setIsSubmitting(false)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader size="sm" />
            Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </form>
  )
}

// Example 7: Loading state in a card
export function CardLoadingExample() {
  const [isLoading, setIsLoading] = useState(true)
  
  return (
    <div className="border rounded-lg p-6">
      {isLoading ? (
        <InlineLoader text="Loading analytics..." />
      ) : (
        <div>{/* Card content */}</div>
      )}
    </div>
  )
}

// Example 8: Button with loading state
export function ButtonLoadingExample() {
  const [isLoading, setIsLoading] = useState(false)
  
  return (
    <button 
      onClick={() => setIsLoading(true)}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading && <Loader size="sm" />}
      {isLoading ? "Loading..." : "Click Me"}
    </button>
  )
}

// Example 9: Table/List loading skeleton
export function ListLoadingExample() {
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState([])
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          <InlineLoader text="Loading menu items..." size="md" />
        </div>
      ) : (
        items.map(item => <div key={item.id}>{/* Item content */}</div>)
      )}
    </div>
  )
}

// Example 10: API call with error handling
export function ApiLoadingExample() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/orders')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  if (isLoading) {
    return <InlineLoader text="Loading orders..." size="md" />
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>
  }
  
  return <div>{/* Render data */}</div>
}

import { useState, useEffect } from "react"

// Helper functions (mock)
async function fetchData() { return [] }
async function submitForm() { }
