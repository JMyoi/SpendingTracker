# BudgetFlow Video Demo Script

## Introduction

Hi, my name is Jay Chen, and my teammate James Liu and I built a web application called **BudgetFlow**.

BudgetFlow is a personal spending tracker designed to help users record expenses, understand their spending habits, and make better budgeting decisions.

For this project, I mainly worked on the frontend, while James mainly worked on the backend. Our tech stack is the PERN stack: PostgreSQL, Express, React with Next.js, and Node.js. We also used Tailwind CSS for styling.

## Application Overview

BudgetFlow allows users to track and analyze their expenses through a clean dashboard, useful charts, and simple budgeting tools.

One of our key features is an **Image to Expenses** import tool. Users can upload receipts, spreadsheets, or bank statement screenshots, and the app uses OpenAI's GPT-4o mini model to help extract expense details and quickly onboard transactions.

## Landing Page

We'll start on the landing page.

The landing page gives users a quick preview of what BudgetFlow offers. It shows a sample dashboard, highlights the main features, and introduces the budgeting tools.

From here, users can either create an account or log in. For this demo, we will use a demo account.

## Dashboard Page

After logging in, we arrive at the dashboard.

The dashboard focuses on the current month. It shows how much the user has spent this month, total expenses across all time, current budget status, monthly spending visuals, and this month's spending broken down by category.

It also shows recent expenses, so users can quickly see their latest activity.

At this point, I will demonstrate how to manually add a new expense.

## Expenses Page

Next, we'll move to the expenses page.

This page shows expenses based on the selected year and month filters. By default, it shows every transaction across all available dates.

Here, we can see the total number of records and the total amount spent. We also have a spending line chart that updates based on the selected year or month.

Currently, our demo data includes expenses from 2025 and 2026.

If we filter by 2026, the table updates to show only transactions from 2026, along with the total records and total spending for that year. The chart also updates to show spending across the months in 2026.

If we switch to 2025, the table and chart update again.

We can also filter into a specific month, such as June, and the page updates the records, totals, and chart for that month.

Then I will switch back to March 2026 and demonstrate the search bar and sorting features. Users can search by title, description, or category, and sort expenses by fields like date, title, category, and amount.

I will also demonstrate the edit and delete buttons.

## Image Import Demo

Next, I'll demonstrate the image import feature.

I will test it with a receipt, a Google Sheets screenshot, and an Apple bank statement screenshot.

I will also show how the app handles bad or unclear input, so users can see that the feature is helpful but still designed with realistic limitations.

## Budgeting Page

Lastly, we'll move to the budgeting page.

Here, users can set a monthly budget and compare their actual spending against that budget.

The app gives a simple rating to help users understand their progress:

- **Excellent** — Under 50% of the budget used
- **OK** — 50% to 80% used, which means the user is at a comfortable pace
- **Fair** — 80% to 100% used, meaning the user is getting close
- **Bad** — Over budget, meaning it is time to course-correct

## Closing

Thank you for watching our demo of BudgetFlow.

We would really appreciate the opportunity to attend CUNY Pitchfest and share what we built.
