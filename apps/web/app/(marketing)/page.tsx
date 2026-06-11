import { Button } from '@grocery-savings/ui-web'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Grocery Savings</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Button asChild>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 pb-8 pt-24 text-center md:pt-32">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Turn grocery sales into meals, not just savings.
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Tell us your ZIP code, dietary needs, and budget per serving. We
            scan this week&apos;s deals, keep only the items at or above your
            minimum % off, and turn them into real meal ideas with recipes and a
            store-by-store shopping list.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/plan">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* How it works */}
        <section className="container py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              How it works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                title="Set your preferences"
                description="Your ZIP code, search radius, household size, dietary restrictions, budget per serving, and the minimum discount you care about."
              />
              <FeatureCard
                title="See the real deals"
                description="We pull this week's sale items from nearby stores and surface only the ones meeting your % off threshold, grouped by store."
              />
              <FeatureCard
                title="Cook the savings"
                description="Sale-driven meal ideas with cost per serving, full recipes, and a deduplicated shopping list organized by store."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Grocery Savings — meals from this week&apos;s deals.
          </p>
          <p className="text-sm text-muted-foreground">
            Pilot market: Cincinnati, OH
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
