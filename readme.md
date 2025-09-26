[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://stand-with-ukraine.pp.ua)

<p align="center">
    <img alt="Budgie Logo" src="assets/black-on-white.svg" width="200">
</p>

# Budgie — Mobile Expenses, Banking & Wealth Tracker (Offline-First)

> A privacy-first money app with offline-first design, optional bank sync, and an AI chat that answers questions about your spending, budgets, debts, goals, and portfolio (stocks & crypto).

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
  - [Phase 0 — Foundations](#phase-0--foundations-week-1)
  - [Phase 1 — Core Expenses & Budgets](#phase-1--core-expenses--budgets-weeks-23)
  - [Phase 2 — Bank Sync & Ingestion](#phase-2--bank-sync-read-only--ingestion-weeks-45)
  - [Phase 3 — Portfolio (Stocks & Crypto)](#phase-3--portfolio-stocks--crypto-weeks-67)
  - [Phase 4 — Debts & Goals](#phase-4--debts--goals-weeks-89)
  - [Phase 5 — AI Chat v1](#phase-5--ai-chat-v1-local-first-weeks-1011)
  - [Phase 6 — Rules, Recurring & Notifications](#phase-6--rules-recurring--notifications-weeks-1213)
  - [Phase 7 — Polish & Public Beta](#phase-7--polish--public-beta-weeks-1415)
  - [Phase 8 — v1 Launch](#phase-8--v1-launch-week-16)
- [Non-Functional Requirements](#non-functional-requirements)
- [AI Chat Capabilities](#ai-chat-capabilities-v1)
- [QA & Testing](#qa--testing)
- [CI/CD](#cicd)
- [Risks & Mitigations](#risks--mitigations)
- [Backlog / Nice-to-Have](#backlog--nice-to-have)
- [Contributing](#contributing)
- [License](LICENSE)

---

## Project Description

**Vision**: Clarity about money without giving up privacy. Budgie works entirely offline, then selectively uses the network for bank sync and market prices when available.

**Audience**: Individuals and couples who want simple day-to-day tracking with a wider view (banking + investments + debts + goals).

**Differentiators**:
- Offline-first core (manual entry always works; everything stored locally)
- Bank sync ingestion that never blocks manual use (read-only; dedupe with local entries)
- Unified wealth view (cash/bank, stocks, crypto, debts, goals)
- Built-in AI chat that speaks plain language about your money (“why did groceries spike?”, “how to hit my trip goal?”)

**Platforms**: iOS & Android (React Native / Expo)
**Monetization (later)**: Free core; Pro adds multi-device sync, advanced rules, expanded connectors, automated exports
**Privacy**: Local database is the source of truth; encryption at rest; opt-in analytics; no ads

---

## Features

- **Expenses**: Quick add (≤3 taps), categories, accounts, budgets (monthly)
- **Insights**: Category breakdown, daily burn, budget usage
- **Bank Sync (read-only)**: OAuth connectors + CSV import fallback, dedupe, rules
- **Portfolio**: Stocks & crypto holdings with cached prices and P&L
- **Debts**: Credit/loan tracking, APR, payoff calculators (snowball/avalanche)
- **Goals**: Targets, deadlines, allocation suggestions
- **AI Chat**: Natural-language Q&A with citations into app views
- **Export**: CSV (month/custom); onboarding with sample data; full offline usability

---

## Assets

- [Logos](https://www.figma.com/design/BGehzLZktv9XRlStPootaE/Budgie?node-id=0-1&t=Apy06tSgKFKIFFO4-1)

---

## Tech Stack

- **App**: React Native (Expo), TypeScript, Expo Router, TanStack Query, Zustand/Jotai
- **Local DB**: WatermelonDB (schema versions & migrations, lazy loading, sync adapter)
- **Bank Sync**: Aggregator/OAuth connectors (abstracted provider API) + CSV import
- *8Market Data**: On-demand price fetch & local cache for stocks/crypto; offline last-known prices
- **AI**: On-device first (small LLM) with optional cloud inference; RAG over local data
- **Observability**: Sentry (crash/perf), opt-in analytics (redacted events)
- **Testing**: Vitest/Jest, React Native Testing Library, Maestro (E2E)
- **CI/CD**: GitHub Actions → EAS build & submit; Maestro for E2E

---

## Architecture

- **Offline-first**: All core features work without network; bank sync & price fetches are additive
- **Ingestion pipeline**: normalize → dedupe (fuzzy match) → categorize (rules) → review queue
- **Price cache**: batched fetch; last-known fallback; manual override
- **AI layer**: embeddings over local data (transactions/budgets/holdings/debts/goals); intent → metric/period/entity; optional cloud for heavy queries
- **Security**: tokens in secure storage; at-rest encryption where available; PII minimization
- **WatermelonDB specifics**: normalized models, background sync adapter for bank imports, schema migrations tracked per version

---

## Roadmap

> Track in GitHub Projects. Use labels `area:*`, `type:feat|bug|doc`, `size:S|M|L`, `prio:P0|P1|P2`.

## Phase 0 — Foundations (Week 1)
**Goals**
- App scaffold, tokens, navigation; WatermelonDB v0; secure storage; CI/E2E

**Deliverables**
- Boot iOS/Android; dark mode
- WMDB schema + migrations; seed sample data
- Actions: typecheck, lint, tests, EAS build; Maestro “app opens”
- Sentry; analytics consent

**Acceptance**
- Cold start < 2s; PR CI green; crash-free dev builds ≥ 99%

**Key Tasks**
- `feat: expo + ts strict + router`
- `feat(contracts): data contracts`
- `feat(db): watermelon schema v0 + migrations`
- `chore(ci): actions + EAS + maestro skeleton`
- `feat(security): secure storage + opt-in analytics`

---

## Phase 1 — Core Expenses & Budgets (Weeks 2–3)

**Goals**
- Ultra-fast manual entry; lists; edit/delete; budgets; base insights

**Deliverables**
- Quick Add (amount → category → account → note)
- Transactions list (virtualized), edit, delete (soft)
- Budgets (monthly/category) + progress ring; insights (category pie, daily line)
- CSV export

**Acceptance**
- Add expense ≤ 3 taps (median); full offline
- Budget recomputes instantly on add/edit/remove
- Unit/component tests for input & budget math

**Key Tasks**
- `feat(tx): quick add + keyboard`
- `feat(budget): model + UI + recompute`
- `feat(insights): category + daily`
- `feat(export): csv (month/custom)`

## Phase 2 — Bank Sync (Read-Only) & Ingestion (Weeks 4–5)

**Goals**
- Link bank; import safely; never block offline usage

**Deliverables**
- Connector abstraction (OAuth UI, token store) + CSV import fallback
- Ingestion pipeline: normalize → dedupe → categorize (rules)
- Manual review queue (imported/uncategorized)
- Background sync (pull on open; user-triggered refresh)

**Acceptance**
- First link pulls 90 days in < 60s (happy path)
- Dedupe rate ≥ 99% vs manual entries (amount/date/merchant heuristics)
- Network failures fail “softly”; app remains usable offline

**Key Tasks**
- `feat(ingest): provider sdk + oauth`
- `feat(ingest): normalizer + dedupe`
- `feat(rules): merchant/time/amount heuristics`
- `ui: review queue + conflict hints`

## Phase 3 — Portfolio (Stocks & Crypto) (Weeks 6–7)

**Goals**
- Manual holdings; price cache; unified net worth

**Deliverables**
- Holdings editor (ticker/qty/cost; crypto: symbol/network)
- Price cache (batched fetch; last-known fallback)
- Portfolio screen: value, P&L (daily/total), allocation
- Watchlists; manual price override

**Acceptance**
- Renders offline with last-known prices
- Price refresh < 2s per symbol (batched)
- P&L matches spreadsheet within ±0.1%

**Key Tasks**
- `feat(prices): cache + adapters`
- `feat(portfolio): holdings + charts`
- `test: rounding/currency math`

## Phase 4 — Debts & Goals (Weeks 8–9)

**Goals**
- Track loans/credit; payoff; fund goals; budget interplay

**Deliverables**
- Debts (APR, min payment, due date), payoff calculators (snowball/avalanche)
- Goals (target/date/priority); allocation suggestions from surplus
- Notifications: due payments, slipping goals

**Acceptance**
- Amortization accurate to lender statement within 1 payment
- Goal ETA responds to budget changes

**Key Tasks**
- `feat(debts): model + calculators + reminders`
- `feat(goals): model + allocation engine`
- `ui: insights → goals/debt widgets`

## Phase 5 — AI Chat v1 (Local-First) (Weeks 10–11)

**Goals**
- Natural-language Q&A and explanations over user data

**Deliverables**
- Embedding index over transactions/budgets/holdings/debts/goals
- Intent detection: query → metric/period/category/entity
- Chat UI with citations to in-app views; privacy toggle (offline-only vs cloud-assist)

**Acceptance**
- Answers < 2s for common queries
- ≥90% correct on curated set; answers link to source screens

**Key Tasks**
- `feat(ai): embeddings + retrieval`
- `feat(chat): intents + tool responses`
- `test: gold-set Q&A`

## Phase 6 — Rules, Recurring & Notifications (Weeks 12–13)

**Goals**
- Reduce manual work; habit-forming nudges

**Deliverables**
- Rules editor (contains/regex → set category/account/goal)
- Recurring transactions (salary/subscriptions) with drift handling
- Alerts: budget 80/100%, low balance, upcoming debt payment

**Acceptance**
- ≥95% of repeated merchants auto-categorized after 2 entries
- Recurring reliability ≥ 99% within 1h of schedule

**Key Tasks**
- `feat(rules): engine + audit log`
- `feat(recurring): scheduler`
- `feat(notify): local notifications`

## Phase 7 — Polish & Public Beta (Weeks 14–15)

**Goals**
- A11y, perf, stability; store prep

**Deliverables**
- Accessibility pass (labels, contrast, dynamic type); haptics/gestures
- Perf: list virtualization; WatermelonDB indices; memoized selectors
- App icons, splash, store metadata; feedback panel

**Acceptance**
- Crash-free users ≥ 99.5% (beta)
- TTI < 1.5s on mid-tier devices

**Key Tasks**
- `perf: profile + optimize`
- `a11y: voiceover/talkback`
- `release: beta metadata + guide`

## Phase 8 — v1 Launch (Week 16)

**Goals**
- Production release; support loop; metrics

**Deliverables**
- Store listings (localized), privacy policy, support site
- Post-launch dashboard: activation, retention, crash
- Data portability docs (export/delete)

**Acceptance**
- Approved on App Store & Play
- Activation ≥ 60% (first 5 transactions within 24h)

**Key Tasks**
- `release: 1.0.0`
- `docs: privacy + data handling`
- `growth: share/export hooks`

---

## Non-Functional Requirements
- **Offline-first**: All core actions work without network; sync & prices are additive
- **Security**: Keystore-backed token storage; PII minimization; redacted analytics
- **Performance**: Add/edit < 100 ms; chat answers < 2 s (local queries)
- **Reliability**: Idempotent ingestion; conflict-safe merges; reversible migrations
- **Accessibility8**: WCAG AA contrast; full screen-reader paths; reduced motion
- **Internationalization**: Locale/currency aware; RTL-safe layouts

## AI Chat Capabilities (v1)
- **Q&A**: “How much did I spend on food last month?”, “What’s my net worth trend?”
- **Explain**: “Why is this month higher?” (high-impact merchants, one-offs)
- **Coach**: “To hit the Trip goal by July, add €X/week or cut Y% from dining.”
- **Navigate**: Answers link to filtered views/charts
- **Privacy Controls**: Offline-only mode vs per-question cloud assist (opt-in)

## QA & Testing

- **Unit**: currency math, dedupe, rules, amortization, P&L
- **Component**: Quick Add, BudgetCard, HoldingsEditor, DebtPlanner, Chat
- **E2E (Maestro)**: First run → Link bank (mock) → Import → Budget updates → Portfolio render → Debt payoff → Chat Q&A
- **Property-based**: dedupe & rules engine

## CI/CD
- **PR checks**: typecheck, lint, tests, bundle size, E2E (Android)
- **Builds**: nightly internal; weekly beta; EAS submit
- **Observability**: symbolication, crash triage, auto-changelog (semantic-release)

## Risks & Mitigations
- **Aggregator variance**: Abstract provider; CSV fallback; robust normalizer
- **Price feeds**: Cache & batch; show timestamps; allow manual overrides offline
- **LLM footprint**: Modular AI (on-device first); streaming; cloud opt-in for complex queries
- **Data integrity**: Import audit log; idempotent merges; user-visible review queue

## Backlog / Nice-to-Have
- Receipt OCR; bank SMS/email parsers
- Widgets & lock-screen complications
- Shared spaces (household) with roles
- Tax lots & realized gains report
- Multi-goal optimizer (Pareto frontier)

## Contributing
- Create small, focused PRs.
- Use Conventional Commits (`feat:`, `fix:`, `chore:`…).
- Add tests for new logic; update docs for user-facing changes.

## License
TBD (e.g., MIT).
