# SpendingTracker

A full-stack spending tracker built with the PERN stack + Next.js.

**Stack:** PostgreSQL · Express · React (Next.js 14) · Node.js · Prisma · Tailwind CSS · TypeScript

---

## Project Structure

```
SpendingTracker/
├── client/       Next.js 14 App Router + Tailwind CSS
└── server/       Express API + Prisma ORM
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string)

---

### Client (Next.js)

```bash
cd client
npm install
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000)

---

### Server (Express)

1. Copy the example env file and fill in your database URL:

```bash
cd server
cp .env.example .env
```

2. Install dependencies and generate the Prisma client:

```bash
npm install
npx prisma generate
```

3. (Optional) Push the schema to your database:

```bash
npx prisma db push
```

4. Start the dev server:

```bash
npm run dev
```

Runs on [http://localhost:5000](http://localhost:5000)

Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`

---

## Scripts

| Location | Command | Description |
|---|---|---|
| `client/` | `npm run dev` | Next.js dev server |
| `client/` | `npm run build` | Production build |
| `server/` | `npm run dev` | Express dev server (nodemon) |
| `server/` | `npm run build` | Compile TypeScript |
| `server/` | `npx prisma studio` | Open Prisma Studio |

## Backend API

### Base URL
http://localhost:5000

---

### User APIs

#### Register
POST /users/register

#### Login
POST /users/login

---

### Expense APIs

#### Get Expenses
GET /expenses?userId=1

#### Create Expense
POST /expenses

#### Update Expense
PUT /expenses/:id

#### Delete Expense
DELETE /expenses/:id