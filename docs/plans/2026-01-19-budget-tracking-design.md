# Budget Tracking - Phase 1 Design

## Overview

Budget tracking feature for Budgie expense tracker. Phase 1 covers core budget functionality: category budgets, overall budget, and budget progress tracking.

## Phased Rollout Plan

| Phase | Features | Status |
|-------|----------|--------|
| **1: Foundation** | Category Budgets, Overall Budget, Budget Progress | This document |
| **2: Engagement** | Budget Alerts, Budget History | Future |
| **3: Flexibility** | Rollover Budgets, Budget Templates | Future |
| **4: Methods** | Envelope, Zero-Based, Pay-Yourself-First | Future |

## Data Model

### Budget Entity

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| name | string? | Optional label (e.g., "January Budget") |
| period | enum | weekly, bi-weekly, monthly |
| periodStartDay | number | 1-28, which day the period starts |
| overallLimit | number | Total spending cap |
| startDate | date | Current period start |
| endDate | date | Current period end |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### BudgetCategoryLimit Entity

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| budgetId | number | Foreign key to Budget |
| categoryId | number | Foreign key to Category |
| limit | number | Spending limit for this category |

### BudgetIncomeExpectation Entity

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| budgetId | number | Foreign key to Budget |
| categoryId | number | Foreign key to income Category |
| expectedAmount | number | Planned income from this source |

### AccountBudgetExclusion Entity

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| accountId | number | Foreign key to Account |
| excludedAt | timestamp | When excluded |

### Key Relationships

- One active Budget per user at a time
- Budget has many BudgetCategoryLimits
- Budget has many BudgetIncomeExpectations
- Accounts can be excluded globally (not per-budget)

## Budget Calculation Logic

### Spent Calculation (per category)

```
spent = sum(expenses in category during period)
      - sum(refunds in category during period)
```

Only includes transactions from non-excluded accounts.

### Budget Status per Category

- `remaining = limit - spent`
- `percentage = (spent / limit) * 100`
- Status thresholds:
  - **On track:** < 80%
  - **Warning:** 80-99%
  - **Over:** >= 100%

### Overall Budget Tracking

- `totalSpent = sum(all expenses) - sum(all refunds)` (from non-excluded accounts)
- `overallRemaining = overallLimit - totalSpent`
- `allocatedAmount = sum(all category limits)`
- `unallocatedBuffer = overallLimit - allocatedAmount`

**Rule:** Sum of category limits <= overall limit (unallocated buffer allowed)

### Income Tracking

- `actualIncome = sum(income transactions by category)`
- `expectedIncome = sum(all BudgetIncomeExpectations)`
- `incomeVariance = actualIncome - expectedIncome`

### Spending Pace

- `daysInPeriod`: total days in current period
- `daysElapsed`: days since period start
- `dailyBudget = overallLimit / daysInPeriod`
- `expectedSpentByNow = dailyBudget * daysElapsed`
- `paceStatus = totalSpent <= expectedSpentByNow ? "on track" : "over pace"`

## Screens & Navigation

### Home Dashboard Widget

**Location:** Home screen, prominent placement

**Compact state:**
- Overall budget progress bar
- Spending pace indicator ("On track" or "$X over pace")
- If any category >80%, show warning badge with count

**Behavior:**
- Tapping widget navigates to Budget Detail screen
- Smart progressive: shows alerts automatically when categories exceed 80%

### Budget Detail Screen (`/budget`)

- **Header:** Period selector (current period, arrows to navigate history)
- **Income section:**
  - Expected vs. actual income per category
  - Total income variance
- **Overall budget section:**
  - Large progress bar with amounts
  - Allocated vs. unallocated breakdown
- **Category budgets section:**
  - List of all budgeted categories
  - Each shows: name, progress bar, "$spent / $limit", percentage
  - Sorted by: over budget first, then by percentage descending
  - Tap category -> Category Budget Detail
- **Unbudgeted spending section:**
  - Shows spending in categories without a budget limit

### Budget Settings Screen (`/budget/settings`)

- Set period type (weekly/bi-weekly/monthly)
- Set period start day
- Set overall budget limit
- Manage category limits (add/edit/remove)
- Manage expected income by category
- Access from Budget Detail via gear icon

## Budget Creation & Editing Flow

### First-time Setup Flow

1. User taps "Set up budget" from widget or menu
2. **Step 1: Period** - Select weekly/bi-weekly/monthly + start day
3. **Step 2: Overall limit** - Enter total spending cap
4. **Step 3: Income (optional)** - Add expected income sources with amounts
5. **Step 4: Categories** - Allocate limits to spending categories
   - Shows running total vs. overall limit
   - Warning if allocations exceed overall
   - Can skip categories (leave unbudgeted)
6. **Confirmation** - Summary of budget, tap to activate

### Editing Existing Budget

- From Budget Settings screen
- Can edit any field without re-running full wizard
- Inline editing for category limits (tap amount -> edit)
- Changes apply to current period immediately

### Period Rollover Behavior

- When period ends, new period auto-starts with same configuration
- Historical periods are preserved for Budget History (Phase 2)
- No rollover of unused amounts in Phase 1 (that's Phase 3)

### Category Limit Quick-add

- From Category Budget Detail, if category has no limit
- "Add budget for this category" prompt
- Simple amount input, auto-adds to current budget

## Validation & Edge Cases

### Validation Rules

- Overall limit: must be positive number
- Category limit: must be positive, cannot exceed overall limit
- Sum of category limits: warning if exceeds overall (but allowed)
- Period start day: 1-28 (avoids month-length issues)
- Expected income: must be positive per source

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| No budget set yet | Widget shows "Set up your budget" prompt |
| Category deleted with budget | BudgetCategoryLimit removed (cascade) |
| Account excluded mid-period | Recalculates spent excluding that account |
| Transaction edited/deleted | Budget amounts recalculate automatically |
| Period with no transactions | Shows $0 spent, 100% remaining, "on track" |
| Overspending | Progress bar shows overflow, "-$X over" displayed |

## Implementation Summary

### New Entities (contracts package)

- `budget/` - Budget entity, schema, table, repository
- `budget-category-limit/` - BudgetCategoryLimit with relations
- `budget-income-expectation/` - BudgetIncomeExpectation with relations
- `account-budget-exclusion/` - Exclusion flag per account

### New Screens (app package)

- `app/(main)/budget/index.tsx` - Budget Detail screen
- `app/(main)/budget/settings.tsx` - Budget Settings/Edit screen
- `app/(main)/budget/setup/` - Multi-step setup wizard

### New Components

- `budget-widget/` - Home dashboard widget
- `budget-progress-bar/` - Reusable progress bar with thresholds
- `budget-category-row/` - Category list item with progress
- `budget-income-row/` - Income expectation vs. actual row

### Services

- `BudgetService` - CRUD operations, period management
- `BudgetCalculationService` - Spent calculations, pace tracking

### Database Migration

- New tables for all budget entities
- Run `yarn db:generate` after schema changes
