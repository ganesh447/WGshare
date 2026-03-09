# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run tests once (vitest run)
npm run test:watch   # Vitest watch mode
npm run preview      # Preview production build
```

To run a single test file:
```bash
npx vitest run src/test/example.test.ts
```

## Architecture

**WGshare** is a mobile-first (430px max-width) flatshare management PWA. There is no backend — all data lives in browser `localStorage`.

### Data Flow

```
localStorage  →  src/lib/data.ts  →  src/context/AppContext.tsx  →  Views / Components
```

- **`src/lib/data.ts`** — single source of all TypeScript types (`Flatmate`, `Bill`, `InventoryItem`, `CleanTask`, `Transaction`, etc.), typed `get<T>()`/`set()` localStorage helpers, seed data, and `calculateBalances()`. All keys use the `wgshare_*` namespace.
- **`src/context/AppContext.tsx`** — reads all localStorage keys, exposes domain data and `updateData(key, value)` to the whole tree. Calling `updateData` writes to localStorage and triggers a re-render via `refresh()`.
- **`src/pages/Index.tsx`** — app shell: 1.8s SplashScreen → OnboardingScreen (if not onboarded) → main app. Renders a view from a `Record<string, ReactNode>` map keyed by `currentView`.

### Navigation

There is **no URL-based routing between sections**. React Router only handles `/` (Index) and `*` (NotFound). Within the app, `currentView` string state in `AppContext` drives which of the 6 views renders. `BottomNav` calls `setCurrentView()` to switch between Dashboard, Inventory, Bills, Cleaning, Payments, and Settings.

### Design System

Dark glassmorphism theme only (no light mode). All design tokens are CSS custom properties in **`src/index.css`**. Key utility classes:
- `.glass-card`, `.glass-surface`, `.glass-input` — frosted glass surfaces
- `.glow-blue`, `.glow-green` — glow effects
- Tailwind extensions for custom colors, radii, and animations are in `tailwind.config.ts`.

UI components are shadcn/ui (Radix UI + Tailwind, configured via `components.json`). Icons from Lucide React.

### Forms

Use React Hook Form + Zod for any new forms. Import the `cn()` utility from `src/lib/utils.ts` for conditional class merging.
