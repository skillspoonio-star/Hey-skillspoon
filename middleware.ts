import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if accessing dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // In a real app, you'd verify the JWT token here
    // For demo purposes, we'll check localStorage on the client side
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
