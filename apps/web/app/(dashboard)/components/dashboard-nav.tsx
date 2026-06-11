'use client'

import { cn } from '@grocery-savings/ui-web'
import { type Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems: { href: Route; label: string }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Settings' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-6">
      <Link href="/" className="text-xl font-bold">
        Grocery Savings
      </Link>
      <div className="flex items-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname === item.href
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
