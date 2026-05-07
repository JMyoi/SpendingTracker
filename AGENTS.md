# SpendingTracker — Project Context

A school project: web-based personal expense tracker. Users register, log in, and record/edit/delete daily expenses categorized by type. Includes a monthly budget feature with over/under analysis and an OCR receipt-scanning helper. Full requirements live in [PRD.txt](PRD.txt); user-facing setup steps live in [README.md](README.md).

Branded "BudgetFlow" in the UI.

## Stack

- **Language:** TypeScript everywhere
- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS — in [client/](client/)
- **Backend:** Node + Express 4 — in [server/](server/)
- **Database:** PostgreSQL via Prisma 5
- **Auth:** bcrypt password hashing, no JWT/session — the client just stores the user object in `localStorage` after login (see [client/lib/api.ts](client/lib/api.ts))
- **OCR:** `tesseract.js` + `sharp` for receipt amount extraction (see [server/src/routes/ocrRoutes.ts](server/src/routes/ocrRoutes.ts))

## Repository layout

```
SpendingTracker/
├── client/                       Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx            Root layout, Inter font, global styles
│   │   ├── page.tsx              Landing
│   │   ├── login/                Login page
│   │   ├── register/             Register page
│   │   ├── dashboard/            Authed dashboard (recent + totals)
│   │   ├── expenses/             Authed list (paginated, sortable, CRUD)
│   │   └── budget/               Authed monthly budget set + status
│   ├── components/
│   │   ├── dashboard/AppShell.tsx        Sidebar + main shell for authed pages
│   │   ├── dashboard/ExpenseRow.tsx      Single row in expenses list
│   │   ├── dashboard/format.ts           Money/date formatting helpers
│   │   ├── dashboard/useRequireUser.ts   Hook: redirect to /login if no localStorage user
│   │   └── ui/{Button,Input}.tsx         Shared form primitives
│   └── lib/api.ts                Single fetch client + types for all backend calls
└── server/
    ├── src/
    │   ├── index.ts              Express bootstrap, CORS, route mounting
    │   ├── prisma.ts             Shared PrismaClient singleton (re-exported as default)
    │   └── routes/
    │       ├── userRoutes.ts     /users — register, login, list
    │       ├── expenseRoutes.ts  /expenses — CRUD + /expenses/dashboard summary
    │       ├── budgetRoutes.ts   /budget  — upsert + GET with spent/percent/status
    │       └── ocrRoutes.ts      /ocr     — multer upload → sharp preprocess → tesseract
    ├── prisma/
    │   ├── schema.prisma         User, Expense, Budget models
    │   ├── migrations/           init + add_budget
    │   └── seed.ts               (Wired via package.json `prisma.seed`)
    ├── eng.traineddata           Tesseract English data, loaded by tesseract.js
    └── uploads/                  multer temp dir (cleaned up after OCR run)
```

## Data model — [server/prisma/schema.prisma](server/prisma/schema.prisma)

- **User** — `id`, unique `username` + `email`, bcrypt-hashed `password`. Cascade-deletes its expenses and budgets.
- **Expense** — `userId`, `title`, `amount` (Float), `category` (free-form string, no enum), `date`, optional `description`.
- **Budget** — `userId`, `amount`, `month` (string like `"2026-04"`). Unique on `(userId, month)` so a user has at most one budget per month; the POST handler uses `upsert` on this composite key.

## Backend conventions

- Server reads `PORT` from env, defaults to **5000**. Health: `GET /api/health`.
- Routes are mounted in [server/src/index.ts](server/src/index.ts): `/users`, `/expenses`, `/budget`, `/ocr`.
- All handlers respond with JSON; errors return `{ error: string }` and an appropriate status (400/404/500).
- `expenseRoutes.ts` uses the shared `prisma` singleton. **`budgetRoutes.ts` instantiates its own `new PrismaClient()`** — inconsistent with the rest of the codebase; prefer the shared singleton for new work.
- Some inline comments in route files are in Chinese (e.g. `// 检查是否存在`). Leave them unless asked to translate.
- No auth middleware: `userId` is passed as a query/body param. Treat the API as trusting the caller — appropriate for a school project, not production.
- Sorting/pagination on `GET /expenses` is allow-listed against `['date','title','category','amount']` and `asc|desc`. Defaults: `sortBy=date`, `sortOrder=desc`, `page=1`, `limit=10`.
- Money is rounded to 2 decimals via `roundMoney` in dashboard responses.

## Frontend conventions

- All HTTP calls go through [client/lib/api.ts](client/lib/api.ts). Add new endpoints there rather than `fetch`-ing inline from components.
- `API_BASE_URL` is `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"`. **Note the mismatch:** the server defaults to `5000`. Either set `NEXT_PUBLIC_API_URL=http://localhost:5000` in a `client/.env.local` or run the server on 5001. Worth flagging if endpoints fail to connect.
- Auth state = `localStorage["currentUser"]` (a JSON `AuthUser`). Use `getCurrentUser` / `storeCurrentUser` / `clearCurrentUser` from `lib/api.ts`. Authed pages should gate via the `useRequireUser` hook.
- Authed pages render inside `<AppShell user={...}>` for the BudgetFlow sidebar (Dashboard / Expenses / Budget + sign-out).
- Tailwind palette: amber-500 accent on stone-50/amber-50 backgrounds. Match this when adding UI.
- TypeScript strict; types for API payloads live alongside the fetchers in `lib/api.ts`.

## Running locally

```bash
# Server
cd server
cp .env.example .env       # NOTE: .env.example is currently MISSING — create .env with DATABASE_URL=postgresql://...
npm install
npx prisma generate
npx prisma db push         # or `prisma migrate dev`
npm run dev                # → http://localhost:5000

# Client (separate terminal)
cd client
npm install
npm run dev                # → http://localhost:3000
```

Prisma Studio: `npx prisma studio` from `server/`.

## Scope reminders (from PRD)

In scope: auth, expense CRUD, categorization, totals, monthly budget + analysis, OCR receipt scanning (added beyond original PRD).
Out of scope: charts/graphs, budget *alerts* beyond the current status string, mobile app, multi-user collab, bank integration.

## Working notes for me (Codex)

- Jay is refreshing full-stack web dev and is new to Prisma — when touching Prisma queries, briefly explain *why* (e.g. why `aggregate` vs `findMany`, what `upsert` does), not just *what* changed.
- Prefer editing existing files; this is a small codebase, don't introduce new abstractions or folders without reason.
- The two real footguns to watch for: (1) the **5000 vs 5001** port mismatch between server default and client default, (2) `budgetRoutes.ts` creating its own `PrismaClient` instead of using `../prisma`.
