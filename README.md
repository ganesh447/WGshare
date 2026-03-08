# WGshare — Flatmate Manager

A mobile-first web app for managing German shared flats (WGs). Handles inventory tracking, bill splitting, cleaning schedules, and payment balances — all stored locally in the browser with no backend required.

**Live target:** 430 px mobile viewport · Dark theme · German-focused (EUR, IBAN, Rundfunkbeitrag)

---

## Features

### Dashboard
- Personalised greeting with current user's name and today's date
- Stats grid: items needed, upcoming bills, chores pending, outstanding balance
- Flatmates row with avatars

### Inventory
- Two tabs: **In Stock** and **Shopping List**
- Status filters: **In Stock** / **Depleted**
- Circular category pills: All, Food, Cleaning, Toiletries, Kitchen, Other
- Progress bar per item (quantity vs. min threshold)
- Mark items as purchased — cost split recorded as a transaction

### Bills
- Add, edit, and track shared bills (Internet, Electricity, Rundfunkbeitrag, etc.)
- Upcoming / Paid tabs; overdue detection with notifications
- Per-person split preview when entering amount

### Cleaning
- **House Cleaning** — weekly rotating task assignments; task labels managed via a `+` modal
- **Weekly Trash** — two alternating bin types (Restmüll/Bio ↔ Papier/Gelber Sack); set the anchor week once and every other week auto-derives; done toggle per week
- Week navigation (← Prev / This Week / Next →)
- Progress bar across house tasks; nav badge for pending tasks

### Payments
- Your personal balance view (what you owe / what's owed to you)
- Tap any person card to see a full per-pair transaction breakdown with amounts coloured green/red
- Transaction history section listing all flat-wide settlements, purchases, and bill payments
- Copy IBAN to clipboard for bank transfer

### Settings
- Flatmate management: add, edit, deactivate, remove
- Flat name and invite code display
- Log Out — clears the current user session and returns to onboarding (flat data stays)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Vanilla JS (ES2020) — no build step |
| Styling | Plain CSS with custom properties (dark theme) |
| Storage | `localStorage` — zero backend, works offline |
| Fonts | Inter via Google Fonts |

> The repo also contains a `CLAUDE.md` with the intended production migration path to **Next.js 15 + Supabase + Drizzle ORM**.

---

## Getting Started

```bash
git clone https://github.com/ganesh447/WGshare.git
cd WGshare
# Open index.html in a browser — no install needed
open index.html
```

On first load you'll be prompted to either **Create a Flat** (generates a 6-character invite code) or **Join a Flat** (enter a flatmate's code). All data is stored in your browser's `localStorage`.

---

## Project Structure

```
WGshare/
├── index.html          # Single-page app shell + all modals
├── css/
│   └── style.css       # All styles (dark theme, components, animations)
└── js/
    ├── data.js         # localStorage layer, helpers, balance calculation
    ├── app.js          # Router, dashboard, onboarding, settings
    ├── flatmates.js    # Flatmate CRUD + avatar rendering
    ├── inventory.js    # Inventory + shopping list
    ├── bills.js        # Bill tracking + payment recording
    ├── cleaning.js     # House cleaning schedule + trash rotation
    ├── payments.js     # Balance view + per-pair breakdown + history
    └── notifications.js# In-app notification drawer
```

---

## Progress Log

| Version | Changes |
|---|---|
| **v0.1 — MVP** | Initial app shell: onboarding, dashboard, inventory, bills, basic cleaning, payments with tab UI |
| **v0.2 — UX Overhaul** | Removed quick-actions grid from dashboard; dropped `low` inventory status tier; added In Stock / Depleted status filter with circular category pill tabs; removed Flatstatic category; redesigned cleaning with task-labels modal (accessible via `+`) and alternating trash types anchored to a chosen week with done toggle; rebuilt payments as a current-user-perspective view with tappable person cards showing per-pair transaction breakdown and a flat-wide history section; restored full flatmate management in Settings alongside flat code and log-out |

---

## Roadmap (CLAUDE.md target stack)

- [ ] Migrate to **Next.js 15** App Router
- [ ] **Supabase** Auth + Postgres + Realtime sync across devices
- [ ] **Drizzle ORM** schema as single source of truth
- [ ] **Zod** validation on all Server Actions
- [ ] Deploy to **Vercel** with preview URLs per PR
