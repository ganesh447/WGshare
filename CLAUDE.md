# WGshare — CLAUDE.md

Flatshare management app for German WGs (shared flats). Handles inventory, bills, cleaning schedules, and payment balances. German-focused: IBAN, EUR, Rundfunkbeitrag. Mobile-first (430px).

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack in one repo, Server Actions, no separate API |
| Language | TypeScript 5 (strict) | Catch errors at compile time, self-documenting |
| Styling | Tailwind CSS v4 | No config file, utility-first, co-located styles |
| Components | shadcn/ui | Accessible, copy-paste ownership, no version conflicts |
| Database | Supabase (Postgres + Auth + Realtime) | Auth + DB + live sync in one service |
| ORM | Drizzle ORM | Type-safe, lightweight, SQL-like, schema = source of truth |
| Validation | Zod | Parse + validate all Server Action inputs before DB writes |
| Deployment | Vercel | Native Next.js, zero-config, preview URLs per PR |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated shell
│   │   ├── layout.tsx          # Bottom nav + header
│   │   ├── page.tsx            # Dashboard
│   │   ├── inventory/page.tsx
│   │   ├── bills/page.tsx
│   │   ├── cleaning/page.tsx
│   │   ├── payments/page.tsx
│   │   └── settings/page.tsx
│   ├── (auth)/
│   │   └── login/page.tsx
│   └── layout.tsx              # Root: fonts, providers
├── components/
│   ├── ui/                     # shadcn/ui primitives — never edit manually
│   └── [feature]/              # e.g. bills/BillCard.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema — single source of truth for types + DB
│   │   └── index.ts            # DB client
│   ├── actions/                # Server Actions, one file per domain
│   │   ├── bills.ts
│   │   ├── inventory.ts
│   │   ├── cleaning.ts
│   │   └── payments.ts
│   └── utils.ts                # formatEur, formatDate, cn()
├── types/                      # Shared TypeScript types (inferred from Drizzle where possible)
└── middleware.ts                # Supabase auth guard
```

---

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run db:push      # Push schema changes to Supabase
npm run db:studio    # Drizzle Studio — visual DB browser
```

---

## Architecture Rules

### Server vs Client Components
- **Default: Server Components.** Fetch data directly, no useEffect, no useState.
- Add `"use client"` only for: interactivity, browser APIs, React hooks.
- All mutations go through Server Actions (`"use server"`) — no API routes.

### Data Fetching Pattern
```typescript
// page.tsx — Server Component, fetches directly
export default async function BillsPage() {
  const bills = await getBills()
  return <BillsList bills={bills} />
}
// BillsList.tsx — "use client" only if interactive
```

### Database Rules
- All schema defined in `lib/db/schema.ts` — never define types elsewhere.
- All monetary amounts stored as **integers (cents)**. `2599` = €25.99. Format only at display layer.
- Row-level security enabled in Supabase — every query scoped to `flatshare_id`.
- Use Drizzle `.returning()` after all inserts/updates.

---

## Coding Conventions

### Naming
- Files: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- Components: `PascalCase`
- Server Actions: verb + noun — `createBill`, `markBillPaid`, `settlePayment`
- DB columns: `snake_case` · TypeScript properties: `camelCase` (Drizzle maps automatically)

### TypeScript
- `strict: true` — no exceptions
- No `any`. Use `unknown` + type guards if needed.
- Infer Drizzle types: `type Bill = typeof bills.$inferSelect`
- No `as` casts except at third-party library boundaries.

### Currency & Dates
- Store amounts as integer cents. Display with `formatEur(cents)` from `lib/utils.ts`.
- Store dates as ISO strings. Parse with `Europe/Berlin` timezone awareness.
- Week starts Monday (ISO 8601).

---

## Domain Model

```
flatshare  1──N  flatmate
flatshare  1──N  bill              (amount_cents, due_date, paid_by_id)
flatshare  1──N  inventory_item    (quantity, min_threshold, last_purchased_by)
flatshare  1──N  clean_task        (name, icon)
clean_task 1──N  clean_assignment  (week_start, flatmate_id, status)
flatshare  1──N  transaction       (from_id, to_id, amount_cents, type)
```

---

## Git Workflow

```bash
git add -p
git commit -m "feat: short description (max 72 chars)"
git push
```

**Types:** `feat` | `fix` | `refactor` | `style` | `chore` | `docs`

- Commit + push after every logical change, no exceptions.
- Never commit `.env.local`.
- Branch naming: `feat/bills-recalculate`, `fix/iban-validation`

---

## What NOT To Do

- No `useEffect` for data fetching — use Server Components
- No `localStorage` — Supabase is the single source of truth
- No API routes (`app/api/`) — use Server Actions
- No global state libraries (Redux, Zustand) — server state + URL state is sufficient
- No inline styles — Tailwind classes only
- No float arithmetic for money — always work in integer cents
- No hardcoded flatmate IDs — derive from Supabase auth session
- Never edit files in `components/ui/` — re-add via `npx shadcn@latest add`
- Never silence TypeScript with `@ts-ignore` — fix the underlying type

---

## Environment Variables

```bash
# .env.local — never commit
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Server only — never expose to client
```
