import Link from 'next/link'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Grocery Savings</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/plan"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Plan meals
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="container flex-1 py-8">{children}</main>
    </div>
  )
}
