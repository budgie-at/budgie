# Budget Alerts - Phase 2 Design

## Overview

Budget alerts notify users when spending approaches or exceeds limits, enabling proactive budget management. This is Phase 2 of the budget tracking feature.

## Alert Types

### 1. Threshold Alerts

Trigger when category or overall budget spending crosses a percentage threshold.

- Default thresholds: 80% (warning) and 100% (exceeded)
- User can customize thresholds per budget in settings
- Fires once per threshold per period - no repeat spam

### 2. Pace Alerts

Trigger at period milestones (25%, 50%, 75% through the period) if spending exceeds that percentage.

- Example: 50% through the month, but already spent 70% of budget → pace alert
- Checks overall budget pace, not per-category
- Helps users course-correct mid-period

### 3. Large Expense Alerts

Trigger when a single transaction exceeds X% of overall budget limit.

- Default: 10% of overall budget (user configurable)
- Example: $500 budget, $60 single purchase → alert
- Fires immediately after transaction is recorded

### 4. Predictive Alerts

Trigger when projected spending will exceed budget by end of period.

- Uses weighted combination: 60% current period trend + 40% last 3 months historical data
- Example: "Based on your spending, you'll likely exceed Dining Out by $45"
- Fires once per category when prediction confidence is high
- Recalculates weekly to avoid noise

## Delivery & Notifications

### In-App Alerts

- **Dashboard widget badge**: Shows count of active alerts (e.g., red "3" badge)
- **Alerts list screen**: Dedicated `/budget/alerts` screen showing all active and recent alerts
- **Inline on budget detail**: Warning banners appear contextually on category rows and overall budget card

### Push Notifications

All threshold-type alerts trigger push notifications when app is closed:

| Alert Type | Example Message |
|------------|-----------------|
| 80% warning | "Heads up: You've used 80% of your Groceries budget" |
| 100% exceeded | "Budget exceeded: You've spent $520 of your $500 Dining Out budget" |
| Large expense | "Large expense: $150 at Amazon (30% of weekly budget)" |
| Pace warning | "Spending alert: Halfway through the month, but 70% of budget spent" |
| Predictive | "Forecast: You're on track to exceed Entertainment by $45" |

### Push Notification Setup

- Uses `expo-notifications` (already bundled)
- Permission prompt on first budget creation or alert settings access
- Respects device Do Not Disturb settings
- Deep links: tapping notification opens relevant budget detail or alerts screen

### What Doesn't Get Push

- Predictive alerts only push once per category per period
- No push for "on track" positive status (avoid notification fatigue)

## Data Model

### BudgetAlertSettings Entity

Stores user preferences per budget.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| budgetId | number | FK to Budget |
| warningThreshold | number | Default 80 (percentage) |
| exceededThreshold | number | Default 100 (percentage) |
| largeExpenseThreshold | number | Default 10 (% of overall budget) |
| paceAlertsEnabled | boolean | Default true |
| predictiveAlertsEnabled | boolean | Default true |
| pushNotificationsEnabled | boolean | Default true |

### BudgetAlert Entity

Stores fired alerts for history and dismissal tracking.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| budgetId | number | FK to Budget |
| categoryId | number? | FK to Category (null for overall alerts) |
| type | enum | THRESHOLD, PACE, LARGE_EXPENSE, PREDICTIVE |
| severity | enum | WARNING, EXCEEDED |
| percentage | number | Actual percentage when fired |
| amount | number? | Relevant amount (spent, transaction, projected) |
| transactionId | number? | FK for large expense alerts |
| dismissedAt | timestamp? | Null if not dismissed |
| periodStart | date | Budget period this alert belongs to |

### Key Relationships

- BudgetAlertSettings: One per Budget (1:1)
- BudgetAlert: Many per Budget (1:N)
- Alerts reference Category optionally (for category-specific alerts)
- Large expense alerts reference Transaction

### No Separate History Table

- Alerts auto-clear logic uses `periodStart` - filter out alerts from previous periods for "active" view
- Historical alerts remain in same table, queryable for alerts history screen

## Calculation & Service Logic

### BudgetAlertService

Core service that evaluates when alerts should fire.

```
checkThresholdAlerts(budgetId)
  → For each category + overall:
    - Calculate current percentage (spent / limit * 100)
    - Check if crossed 80% or 100% (or custom thresholds)
    - Check if alert already fired this period for this threshold
    - If new threshold crossed → create alert + send push

checkPaceAlerts(budgetId)
  → Calculate days elapsed / total days in period
  → If at 25%, 50%, or 75% milestone (±1 day tolerance):
    - Compare spending percentage to time percentage
    - If spending % > time % → fire pace alert (if not already fired)

checkLargeExpenseAlert(transactionId)
  → On transaction create/update:
    - Get transaction amount
    - Compare to (overallLimit * largeExpenseThreshold / 100)
    - If exceeds → fire alert immediately

checkPredictiveAlerts(budgetId)
  → Weekly calculation:
    - Get current period spending rate
    - Get last 3 months historical average per category
    - Weighted projection: 60% current trend + 40% historical
    - If projected > limit by meaningful amount (>5%) → fire alert
```

### Trigger Points

| Trigger | Checks Run |
|---------|------------|
| Transaction created/updated/deleted | Threshold + large expense |
| App foreground | All checks (debounced, max once per hour) |
| Background task | Daily: pace and predictive alerts |
| Period rollover | Clear active alerts, reset fired-alert tracking |

## UI Components & Screens

### Dashboard Widget Enhancement

- Add alert badge to existing budget widget (from Phase 1)
- Badge shows count of unread/undismissed alerts
- Color: `destructive` if any exceeded alerts, `warning` if only warnings
- Tapping badge navigates to alerts list

### Alert Banner Component

Reusable inline alert for budget detail screen.

- Variants: `warning` (yellow), `destructive` (red)
- Shows: icon, message, dismiss button
- Example: "⚠️ 85% of Groceries budget used" [×]

### Alerts List Screen (`/budget/alerts`)

- Header: "Budget Alerts" with filter chips (All / Active / Dismissed)
- List grouped by: Today, This Week, Earlier
- Each alert row shows:
  - Icon (threshold/pace/large/predictive)
  - Category name or "Overall Budget"
  - Alert message
  - Timestamp
  - Swipe to dismiss or tap dismiss button
- Empty state: "No alerts — you're on track!"

### Budget Detail Inline Alerts

- Warning banner at top if overall budget has active alert
- Per-category: alert icon on category row if that category has alert
- Tapping category row shows alert details in context

### Settings Integration

New section in `/budget/settings`: "Alert Preferences"

- Toggle: Push notifications on/off
- Sliders: Warning threshold (50-95%), Large expense threshold (5-25%)
- Toggles: Pace alerts on/off, Predictive alerts on/off

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Budget deleted | Cascade delete all alerts for that budget |
| Category deleted | Remove alerts for that category, keep overall alerts |
| Transaction edited to lower amount | Don't retract already-fired threshold alerts |
| Transaction deleted | Recalculate, but don't retract past alerts |
| User disables push mid-period | Stop new pushes, keep in-app alerts |
| No historical data for predictions | Use current period only (100% weight) |
| Multiple thresholds crossed at once | Fire separate alerts for each (80% and 100%) |
| Period rolls over with active alerts | Auto-dismiss, start fresh |

## Implementation Notes

### Background Task

- New task: `budget-alert-check.task.ts`
- Runs daily (configurable)
- Checks pace alerts and predictive alerts
- Batches push notifications to avoid spam

### Performance Considerations

- Threshold checks on transaction change: debounce 500ms
- Cache last calculation timestamp to avoid redundant checks
- Alerts query uses index on `budgetId` + `periodStart`

### Push Notification Permissions

- Request on first budget setup completion
- Fallback: prompt in alert settings if denied initially
- Graceful degradation: in-app alerts work without push permission

### Alert Dismissal

- Hybrid approach: User can dismiss manually, or alerts auto-clear at period end
- Dismissed alerts remain in database for history viewing
- `dismissedAt` timestamp tracks when user acknowledged

## New Entities Summary (contracts package)

- `budget-alert-settings/` - User preferences per budget
- `budget-alert/` - Fired alerts with dismissal tracking

## New Screens Summary (app package)

- `app/(main)/budget/alerts.tsx` - Alerts list screen
- Enhanced `/budget/settings` - Alert preferences section

## New Components Summary

- `budget-alert-badge/` - Badge showing alert count on widget
- `budget-alert-banner/` - Inline dismissable alert banner
- `budget-alert-row/` - List item for alerts screen
- `budget-alert-settings-section/` - Settings form section

## New Services Summary

- `BudgetAlertService` - Alert evaluation and creation
- `BudgetAlertNotificationService` - Push notification delivery

## Dependencies

- Phase 1 (Budget Foundation) must be implemented first
- `expo-notifications` - Already bundled, needs configuration
