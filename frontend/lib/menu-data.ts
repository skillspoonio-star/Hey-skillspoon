export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  image: string
  description: string
  isVeg: boolean
  preparationTime?: string
  isPopular?: boolean
  allergens?: string[]
}

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
  const url = `${base}/api/menu/items`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch menu items: ${res.status}`)
  const data: any[] = await res.json()

  return data.map((it) => {
    // parse preparation time (e.g. "25 mins" -> 25)
    const preparationTime = it.prepTime
    const formattedCategory = toTitleCase(it.category ?? "")

    return {
      id: Number(it.id),
      name: it.name ?? "",
      price: Number(it.price ?? 0),
      category: formattedCategory,
      image: it.image ?? "",
      description: it.description ?? "",
      isVeg: Boolean(it.isVeg),
      preparationTime,
      isPopular: Boolean(it.isPopular),
      allergens: Array.isArray(it.allergens) ? it.allergens : undefined,
    } as MenuItem
  })
}


export const categories = [
  "All",
  "Main Course",
  "Rice & Biryani",
  "Dal & Curry",
  "Breads",
  "Beverages",
  "Desserts",
  "Starters",
]
