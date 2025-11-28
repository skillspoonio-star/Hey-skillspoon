# Loader Component Usage Guide

## Overview
The loader system provides consistent loading states across the Hey Paytm application.

## Components

### 1. `Loader` - Base Component
Basic spinner with customizable size and optional text.

```tsx
import { Loader } from "@/components/ui/loader"

<Loader size="md" text="Loading..." />
```

**Props:**
- `size`: "sm" | "md" | "lg" | "xl" (default: "md")
- `text`: Optional loading text
- `className`: Additional CSS classes

---

### 2. `FullPageLoader` - Blocking Overlay
Full-screen overlay that blocks user interaction. Use for critical operations like payment processing.

```tsx
import { FullPageLoader } from "@/components/ui/loader"

{isProcessing && <FullPageLoader text="Processing payment..." />}
```

**Props:**
- `text`: Loading text (default: "Loading...")

**Use Cases:**
- Payment processing
- Order submission
- Critical data operations

---

### 3. `PageLoader` - Full Page Loading
Full-screen loader for page transitions. Already implemented in Next.js `loading.tsx` files.

```tsx
import { PageLoader } from "@/components/ui/loader"

export default function Loading() {
  return <PageLoader text="Loading dashboard..." />
}
```

**Props:**
- `text`: Loading text (default: "Loading...")

**Use Cases:**
- Next.js loading.tsx files
- Page-level loading states
- Route transitions

---

### 4. `InlineLoader` - Component Loading
Smaller loader for inline use within components.

```tsx
import { InlineLoader } from "@/components/ui/loader"

{isLoading ? (
  <InlineLoader text="Loading orders..." size="md" />
) : (
  <OrderList orders={orders} />
)}
```

**Props:**
- `text`: Optional loading text
- `size`: "sm" | "md" (default: "sm")

**Use Cases:**
- Loading data within cards
- Table/list loading states
- Form sections

---

## Implementation Examples

### Example 1: Menu Page with Loading State
```tsx
const [isLoading, setIsLoading] = useState(true)
const [menuItems, setMenuItems] = useState([])

useEffect(() => {
  const loadMenu = async () => {
    setIsLoading(true)
    try {
      const items = await fetchMenuItems()
      setMenuItems(items)
    } finally {
      setIsLoading(false)
    }
  }
  loadMenu()
}, [])

return (
  <div>
    {isLoading ? (
      <InlineLoader text="Loading menu..." size="md" />
    ) : (
      <MenuGrid items={menuItems} />
    )}
  </div>
)
```

### Example 2: Payment Processing
```tsx
const [isProcessing, setIsProcessing] = useState(false)

const handlePayment = async () => {
  setIsProcessing(true)
  try {
    await processPayment()
    router.push('/confirmation')
  } finally {
    setIsProcessing(false)
  }
}

return (
  <>
    <button onClick={handlePayment}>Pay Now</button>
    {isProcessing && <FullPageLoader text="Processing payment..." />}
  </>
)
```

### Example 3: Button Loading State
```tsx
<button disabled={isLoading} className="flex items-center gap-2">
  {isLoading && <Loader size="sm" />}
  {isLoading ? "Submitting..." : "Submit Order"}
</button>
```

### Example 4: Card Loading
```tsx
<Card>
  <CardContent>
    {isLoading ? (
      <InlineLoader text="Loading analytics..." />
    ) : (
      <AnalyticsChart data={data} />
    )}
  </CardContent>
</Card>
```

---

## Already Implemented

The loader is already active in these locations:

1. **Root Loading** - `/app/loading.tsx`
2. **Dashboard Loading** - `/app/dashboard/loading.tsx`
3. **Menu Pages:**
   - `/app/delivery/menu/loading.tsx`
   - `/app/takeaway/menu/loading.tsx`
   - `/app/restaurant-info/menu/loading.tsx`
4. **Takeaway Menu** - `/app/takeaway/menu/page.tsx` (inline loading)

---

## Best Practices

1. **Use FullPageLoader sparingly** - Only for critical operations that must block the UI
2. **Prefer InlineLoader** - For most component-level loading states
3. **Always handle errors** - Show error states when loading fails
4. **Set loading to false in finally** - Ensures loading state is cleared even on error
5. **Provide meaningful text** - Help users understand what's loading

---

## Styling

The loader automatically adapts to your theme:
- Uses `border-primary` for the spinner color
- Respects light/dark mode
- Includes smooth animations
- Responsive sizing

---

## Need Help?

Check `frontend/components/loader-examples.tsx` for more detailed examples.
