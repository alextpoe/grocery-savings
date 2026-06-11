# Golden Repo

A production-ready monorepo starter with Next.js, React Native (Expo), and Supabase.

## Stack

| Layer           | Choice                               |
| --------------- | ------------------------------------ |
| Structure       | Turborepo monorepo                   |
| Package Manager | pnpm                                 |
| Web             | Next.js 14+ (App Router)             |
| Mobile          | Expo / React Native                  |
| Backend         | Supabase (Postgres + Edge Functions) |
| Auth            | Supabase Auth                        |
| UI (Web)        | shadcn/ui + Tailwind                 |
| UI (Mobile)     | Tamagui                              |
| State           | Jotai                                |
| Server State    | TanStack Query                       |
| Email           | Resend (React Email)                 |
| Hosting         | Vercel                               |
| Testing         | Vitest + Playwright + RTL            |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase CLI (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/grocery-savings.git
cd grocery-savings

# Install dependencies
pnpm install

# Copy environment variables (root) and symlink for Next.js —
# Next.js reads .env.local from apps/web/, NOT the monorepo root
cp .env.example .env.local
ln -sf ../../.env.local apps/web/.env.local

# Start local Supabase (optional)
supabase start

# Generate Supabase types
pnpm db:generate

# Start development servers
pnpm dev
```

### Available Scripts

```bash
pnpm dev              # Run all apps in development
pnpm dev:web          # Run web app only
pnpm dev:mobile       # Run mobile app only
pnpm verify           # lint + typecheck + unit tests (run before claiming done)
pnpm verify:db        # Smoke-test schema/RLS/storage against local Supabase
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm test:e2e         # Run E2E tests
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
pnpm format           # Format code with Prettier
pnpm db:generate      # Generate Supabase types
pnpm db:reset         # Reset local database
```

## Project Structure

```
grocery-savings/
├── apps/
│   ├── web/              # Next.js App Router
│   └── mobile/           # Expo Router
├── packages/
│   ├── api/              # Supabase client, TanStack Query hooks
│   ├── ui-web/           # shadcn/ui components
│   ├── ui-mobile/        # Tamagui components
│   ├── ui-tokens/        # Shared design tokens
│   ├── utils/            # Zod schemas, Jotai atoms, formatters
│   ├── config/           # ESLint, TypeScript, Prettier configs
│   └── transactional/    # React Email templates
├── supabase/
│   ├── migrations/       # Database migrations
│   └── seed.sql          # Seed data
└── tests/e2e/            # Playwright tests
```

## Features

### Authentication

- Email/password sign-in and sign-up
- Magic link authentication
- Password reset flow
- OAuth ready (Google, GitHub, Apple)

### Marketing (Web)

- Responsive landing page
- Dark/light mode toggle
- Feature sections

### Dashboard

- Authenticated dashboard shell
- User profile management
- Settings page

### Mobile

- Native auth flows
- Tab-based navigation
- Secure token storage

## AI / Agentic Workflow

This template ships project-level Claude Code automation:

- `CLAUDE.md` — verification rules, architecture, and how to add a feature
- `.claude/rules/` — security model + coding style (auto-loaded each session)
- `.claude/skills/new-migration/` — checklist for safe schema changes
- `.claude/commands/adr.md` — `/adr` records architectural decisions in `docs/adr/`
- `.claude/settings.json` — auto-format hook + permission allow/deny rules

The data-access model (anon-key client + user-scoped RLS) is documented in `docs/adr/0001-anon-key-rls-data-access.md`.

## Environment Variables

Create a `.env.local` file at the monorepo root (see Installation for the `apps/web` symlink) with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mobile (for Expo)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Resend (email)
RESEND_API_KEY=

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

### Web (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Mobile (EAS)

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Build: `eas build --platform all`

## License

MIT
