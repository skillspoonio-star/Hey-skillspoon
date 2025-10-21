"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarRail, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Bell, LogOut, Activity, Store, ShoppingBag, Truck, CalendarCheck, ChefHat, TableIcon, ClipboardList, CreditCard, BarChart3, ListTree, Boxes, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authChecked, setAuthChecked] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    async function verify() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuth') : null
      if (!token) {
        router.push('/admin/login')
        return
      }
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
        const res = await fetch(`${base}/api/auth/verify`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
        if (!mounted) return
        if (!res.ok) {
          localStorage.removeItem('adminAuth')
          router.push('/admin/login')
          return
        }
        setAuthChecked(true)
      } catch (e) {
        localStorage.removeItem('adminAuth')
        router.push('/admin/login')
      }
    }
    verify()
    return () => { mounted = false }
  }, [router])

  // derive activeKey from current pathname so client-side navigation highlights correctly
  const parts = (pathname || '').split('/').filter(Boolean)
  const activeKey = parts.length >= 2 && parts[0] === 'dashboard' ? parts[1] : 'home'

  if (!authChecked) return null

  const menu = [
    { key: 'home', label: 'Live Orders', icon: Activity, badge: 0 },
    { key: 'counter', label: 'Counter Orders', icon: Store },
    { key: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
    { key: 'delivery', label: 'Delivery Orders', icon: Truck },
    { key: 'reservations', label: 'Reservations', icon: CalendarCheck },
    { key: 'kitchen', label: 'Kitchen Display', icon: ChefHat },
    { key: 'table-management', label: 'Table Management', icon: TableIcon },
    { key: 'table-assignment', label: 'Table Assignment', icon: ClipboardList },
    { key: 'payment', label: 'Payment Confirmation', icon: CreditCard },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'menu', label: 'Menu Management', icon: ListTree },
    { key: 'inventory', label: 'Inventory', icon: Boxes },
    { key: 'staff', label: 'Staff', icon: Users },
  ]

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    router.push('/admin/login')
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar collapsible="icon" variant="inset" className="border-r">
          <SidebarHeader>
            <div className="px-2 py-1 flex items-center justify-start gap-2">
              <img src="/hey-paytm-logo.png" alt="Hey Paytm logo" className="w-8 h-8 rounded-lg shadow-sm" />
              <div className="text-sm group-data-[collapsible=icon]:hidden">
                <div className="font-semibold">Hey Paytm</div>
                <div className="text-xs text-muted-foreground">Dashboard</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menu.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeKey === item.key}
                    onClick={() => router.push(`/dashboard/${item.key === 'home' ? 'home' : item.key}`)}
                    title={item.label}
                    className="justify-start gap-3 data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:bg-primary/10"
                  >
                    <item.icon className="w-4 h-4" aria-hidden="true" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    {typeof item.badge !== 'undefined' && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto group-data-[collapsible=icon]:hidden">{item.badge}</Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} title="Logout" className="justify-start gap-3 hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarRail />
        <SidebarInset>
          <header className="bg-card border-b border-border p-4 lg:p-6">
            <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <img src="/hey-paytm-logo.png" alt="Hey Paytm logo" className="w-10 h-10 rounded-xl shadow-sm" />
                <div>
                  <h1 className="font-sans font-bold text-lg">Hey Paytm Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Restaurant Management System</p>
                </div>
              </div>
              <div className="flex items-center gap-3 lg:gap-4">
                <ThemeToggle />
                <div>
                  <Button variant="outline" size="sm" className="rounded-full bg-transparent text-sm lg:text-base">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                    {notifications.length > 0 && <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">{notifications.length}</Badge>}
                  </Button>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">Spice Garden Restaurant</p>
                  <p className="text-xs text-muted-foreground">Online • Admin</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full bg-transparent text-sm lg:text-base">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
