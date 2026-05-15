# BudgetFlow 

BudgetFlow is a personal spending tracker designed to help users record expenses, understand their spending habits, and make better budgeting decisions. Built as a full-stack web application with the PERN stack and Next.js, it pairs a clean dashboard experience with smart features that reduce the friction of tracking day-to-day spending.

**Stack:** PostgreSQL · Express · React (Next.js 14) · Node.js · Prisma · Tailwind CSS · TypeScript

Demo Video: https://www.loom.com/share/4a2870ca3ea74b238e39327df3fa84c3

---

## Features

### Dashboard
At-a-glance view of your most recent expenses, monthly totals, and current budget status — your financial snapshot the moment you log in.

<img width="1480" height="753" alt="image" src="https://github.com/user-attachments/assets/51cb40f1-fcd0-4a78-a46e-e8f797d815fa" />

### Expenses with Charts & Filtering
Browse, sort, and filter your full transaction history by date, category, or amount. Visual charts surface spending trends across categories so you can spot where your money actually goes.
<img width="1271" height="652" alt="image" src="https://github.com/user-attachments/assets/1a23d39a-3292-47d1-b1ca-8ebbffd52287" />
Chart updates dynamically based on selected year and or month
<img width="1258" height="308" alt="image" src="https://github.com/user-attachments/assets/9b859828-6aa6-4251-a756-d70d4dfc4ec8" />
<img width="1247" height="305" alt="image" src="https://github.com/user-attachments/assets/d56f82f7-747d-46a2-9df2-0f03ad11caf2" />


### Import via Image (Bank Statements, Receipts, etc)
Skip the manual data entry — upload a photo of a receipt and BudgetFlow extracts the amount and details for you, turning a receipt into a logged expense in seconds.

<img width="875" height="458" alt="image" src="https://github.com/user-attachments/assets/856cad7a-07a5-4123-9094-1a2ae2203a5e" />
Input Image: 
<img width="397" height="645" alt="image" src="https://github.com/user-attachments/assets/9a795024-79a8-4d6f-a5b1-7e97f16bfcd1" />

<img width="871" height="687" alt="image" src="https://github.com/user-attachments/assets/2214d393-3aba-4998-8a47-b7d943f3fcdd" />


### Monthly Budgeting & Analysis
Set a budget for each month and get real-time over/under analysis as you spend, so you always know where you stand before the month ends.
<img width="1278" height="569" alt="image" src="https://github.com/user-attachments/assets/f8ddbed8-1d5d-4eb8-9ca8-64e0ad5b6fb4" />
Budget vs. Actual Spending chart centered around selected month 
<img width="1254" height="365" alt="image" src="https://github.com/user-attachments/assets/7e30898e-ce07-450d-bdbf-3137d96a2ea3" />


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

## Additional Features

#### Set or Update Budget
POST /budget

#### Get Budget
GET /budget?userId=1&month=2026-04

#### Scan Receipt (OCR)
POST /ocr
