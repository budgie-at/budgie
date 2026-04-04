# Rules Feature Analysis

Comprehensive analysis of the Rules feature implementation in Budgie, evaluated against 6 core UX principles:

1. **Minimum possible user effort**
2. **Smart defaults over configuration**
3. **One-tap where possible, two-tap maximum**
4. **The app does the work, the user supervises**
5. **Smooth, purposeful animation everywhere**
6. **Invisible complexity**

---

## 1. Architecture & Code Structure

### File Map (99 files in `packages/app/src/rule/`)

| Layer            | Count | Key Files                                                                                                                                                                                                          |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Services         | 3     | `rule.service.ts`, `rule-engine.service.ts`, `rule-matcher.service.ts`                                                                                                                                             |
| Hooks            | 6     | `use-rule-form.hook.ts`, `use-suggest-rule-detection.hook.ts`, `use-create-suggest-rule.hook.ts`, `use-has-conflicting-rules.hook.ts`, `use-minimum-field-array.hook.ts`, `use-rule-condition-value-field.hook.ts` |
| Queries          | 3     | `use-get-all-rules.query.ts`, `use-get-enabled-rules.query.ts`, `use-get-rule-by-id.query.ts`                                                                                                                      |
| Utils            | 13    | Evaluation, SQL generation, detection mode, duplicate detection, condition building                                                                                                                                |
| Components       | 40    | Form sections, selectors, pills, cards, modal content, conflict warnings                                                                                                                                           |
| Constants        | 11    | Batch processing, field/operator maps, condition fields, action types                                                                                                                                              |
| Interfaces       | 12    | Type definitions for all domain objects                                                                                                                                                                            |
| Context/Provider | 8     | Modal contexts for form, suggestion, selectors                                                                                                                                                                     |
| Routes           | 5     | `/settings/rules`, `/rule-form`, `/suggest-rule`, `/rule-selector`, `/rule-mcc-selector`                                                                                                                           |

**Integration point:** `packages/app/src/transaction/components/rule-pill-slot/rule-pill-slot.tsx` — embedded in transaction edit screens.

**Contracts package:** `rule/`, `rule-condition/`, `rule-action/` — tables, enums, repositories, schemas, relations.

### Separation of Concerns — GOOD

Clean three-tier architecture:

- **Data layer** (contracts): Drizzle tables, repositories with transaction support
- **Service layer** (app): RuleService (CRUD), RuleMatcherService (matching), RuleEngineService (execution)
- **UI layer** (app): Components, hooks, queries

Services are class-based singletons (per project convention). Pure utility functions are properly extracted. No business logic in components.

### Integration with Other Modules — GOOD

- `transaction` module via `RulePillSlot`
- `sync/service/monobank-sync.service.ts` calls `ruleEngineService.applyRulesToTransactions()` after batch creation
- `import/service/importer.service.ts` same call after CSV import
- `category`, `tag`, `account`, `mcc-category` modules via selector components

### Extensibility — MIXED

**Good:** Adding new condition fields only requires updating the enum, adding a case to `getConditionFieldValue()` in `evaluate-rule-condition.util.ts`, optionally adding SQL support in `build-rule-condition-sql.util.ts`, and adding a value input component.

**Bad:** Adding new action types requires changes in 6+ places: enum, table CHECK constraints, `applyRuleActions()` switch statement in `rule-engine.service.ts:196`, `RuleActionRow` conditional rendering, `RuleActionTypeSelector` filtering, and `RuleActionPill` rendering. The action system is not pluggable.

### Background Execution — PARTIAL (Violates Principle #4)

Rule execution during sync/import is non-blocking (batched with 50ms delays, `Promise.allSettled`). However:

- **No summary after auto-application.** When rules apply during bank sync, the user gets zero feedback. No "12 transactions categorized by 3 rules" notification.
- **No undo mechanism.** Transactions are marked `updatedBy: RULE` but this is never surfaced in the UI.
- **"Apply to existing" blocks the UI** with a native Alert, then runs synchronously with no progress indicator.

---

## 2. Data Model & Types

### Database Schema

**Rules table** (`packages/contracts/src/rule/table/rule-entity.table.ts`):

```
rules: id, createdAt, updatedAt, deletedAt, enabled (bool, default true), conditionMatchType (ALL|ANY, default ALL)
```

**Rule conditions table** (`packages/contracts/src/rule-condition/table/rule-condition-entity.table.ts`):

```
rule_conditions: id, createdAt, updatedAt, deletedAt, ruleId (FK CASCADE), field (enum), operator (enum), value (text), secondaryValue (text, nullable)
CHECK: operator != 'BETWEEN' OR secondaryValue IS NOT NULL
```

**Rule actions table** (`packages/contracts/src/rule-action/table/rule-action-entity.table.ts`):

```
rule_actions: id, createdAt, updatedAt, deletedAt, ruleId (FK CASCADE), type (enum), categoryId (FK CASCADE, nullable), tagId (FK CASCADE, nullable), accountId (FK CASCADE, nullable)
CHECK: SET_CATEGORY requires categoryId, ADD_TAG requires tagId, CONVERT_TO_TRANSFER requires accountId
```

**Transaction update tracking:**

```
transactions.updatedBy: USER | RULE (nullable)
```

### Enums

- **Fields:** `TITLE`, `COMMENT`, `AMOUNT`, `ACCOUNT_ID`, `MCC_CODE`, `TRANSACTION_TYPE`, `EXTERNAL_SOURCE`
- **Operators:** `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `NOT_CONTAINS`, `MATCHES_REGEX`, `GREATER_THAN`, `LESS_THAN`, `BETWEEN`, `IN`
- **Action Types:** `SET_CATEGORY`, `ADD_TAG`, `CONVERT_TO_TRANSFER`
- **Match Types:** `ALL` (AND), `ANY` (OR)

### Missing Fields — CRITICAL GAPS

| Missing Field                  | Impact                                                                                            | Principle Violated |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------ |
| `priority` / `sortOrder`       | Users cannot reorder rules. First-match-wins for exclusive actions is implicit by creation order. | #1, #6             |
| `matchCount`                   | No way to know if a rule is useful or stale                                                       | #4                 |
| `lastMatchedAt`                | No way to know when a rule last fired                                                             | #4                 |
| `name` / `description`         | Rules have no user-facing label — only raw conditions/actions displayed                           | #6                 |
| Dismissed suggestions tracking | No persistence for dismissed suggestions — they can reappear                                      | #1                 |

### Cascade Deletion Risk — SERIOUS

All three FK columns on `rule_actions` use `ON DELETE CASCADE`:

- **Deleting a category silently removes SET_CATEGORY actions from rules.** A rule could end up with zero actions (a no-op rule) and the user is never notified.
- **Deleting a tag removes ADD_TAG actions the same way.**
- **Deleting an account removes CONVERT_TO_TRANSFER actions.**

Violates Principle #4 — the app should warn before deleting entities referenced by rules.

### Flexibility for Future Types — LIMITED

Supports: multiple conditions with AND/OR, multiple actions per rule, arbitrary fields/operators.

Does NOT support: compound conditions (nested AND/OR groups), regex at SQL level, amount conditions at SQL level, rule chaining, scheduled/time-based rules.

---

## 3. Rule Engine / Execution Logic

### Execution Flow (`rule-engine.service.ts`)

1. `applyRulesToTransactions(transactionIds, transactionInputs)` fetches all enabled rules (line 32)
2. Builds MCC code map only if needed — lazy optimization (lines 155-175)
3. Converts inputs to evaluation format with `toRuleEvaluationInput()` — microunits to display units (line 38)
4. Processes in batches of `RULE_BATCH_SIZE=20` with `RULE_BATCH_DELAY_MS=50` ms delay (line 40)
5. For each transaction: evaluates ALL rules, applies matching actions within a DB transaction (line 129)
6. `Promise.allSettled` ensures one failure doesn't block the batch (line 48)

### Priority / Ordering — MISSING (Violates Principle #6)

Rules execute in `id ASC` order (implicit creation order). The UI shows an "order badge" (#1, #2, etc.) implying priority, but:

- Users CANNOT reorder rules
- There's no `priority` column in the schema
- For exclusive actions (SET_CATEGORY, CONVERT_TO_TRANSFER), the first matching rule wins — but the user has no control over which is "first"
- The order badge is misleading — it implies controllable priority but offers none

### Conflict Resolution — MINIMAL

- **Exclusive actions:** First-match-wins tracked via `Set<RuleActionTypeEnum>` in `applyRuleActions()` (line 198)
- **ADD_TAG:** All matching rules add their tags (potential duplicate tag creation)
- **Cross-rule conflicts:** `useHasConflictingRules` warns during creation/editing if other rules use same exclusive types. Warning only — doesn't prevent creation.
- **No per-transaction conflict resolution UI.** If multiple rules match, user can't know which rule "won."

### Performance — GOOD for common cases, DANGEROUS for edge cases

**Fast path (Tier 1 — Pure SQL):** Conditions translatable to SQL use `TransactionRuleRepository` with proper JOINs. Excellent.

**Medium path (Tier 2 — SQL + JS):** For ALL match type, narrows via SQL first, filters in memory. Good for mixed conditions.

**Slow path (Tier 3 — Legacy full scan):** Full table scan in batches of 20 for:

- ANY match type with AMOUNT conditions
- ANY match type with MATCHES_REGEX conditions

With 10,000 transactions, the legacy path = 500 batches x 50ms delay = ~25 seconds minimum. **Performance cliff.**

### Silent Failure During Sync — PROBLEMATIC

In `applyRulesToTransactions()` (line 48), `Promise.allSettled` catches per-transaction failures but:

- No logging of failures
- No tracking of which transactions failed
- The calling code in `monobank-sync.service.ts` wraps the entire rule call in try-catch and continues silently

### Post-Application Review — MISSING (Violates Principle #4)

- No summary notification ("12 transactions categorized by 3 rules")
- No way to filter transactions by "updated by rule"
- No undo mechanism
- `updatedBy: RULE` tracked in DB but never surfaced in UI

---

## 4. Rule Creation Flow (Manual)

### Tap Count Audit — Most Common Rule ("Title contains X -> Set Category Y")

| Step                           | Taps           | Notes                                     |
| ------------------------------ | -------------- | ----------------------------------------- |
| Navigate to Settings           | 1              | Tab bar                                   |
| Tap Rules                      | 1              | Settings list                             |
| Tap "+" create button          | 1              | Rules list                                |
| (Title field is default)       | 0              | Already selected                          |
| (Contains operator is default) | 0              | Already selected                          |
| Tap value input, type text     | 1 + typing     | Text input                                |
| Tap action type selector       | 1              | **Default is ADD_TAG, not SET_CATEGORY!** |
| Select "Set Category"          | 1              | Bottom sheet                              |
| Tap category selector          | 1              | Form field                                |
| Select category                | 1              | Category modal                            |
| Tap Save                       | 1              | Footer button                             |
| "Apply to existing?" alert     | 1-2            | Optional                                  |
| **Total**                      | **10-12 taps** |                                           |

### Problems

1. **Default action is ADD_TAG, not SET_CATEGORY** (`rule-actions-section.tsx:13`). Most common action requires changing the default. _Violates Principle #2._

2. **No smart prefill from context.** Creating from scratch requires filling every field. No templates, no "What would you like to automate?" wizard. _Violates Principle #1._

3. **Technical labels exposed.** "Condition 1", "MCC Code", "External Source", "Transaction Type" in field selectors. _Violates Principle #6._

4. **Form-based, not sentence-based.** Separate field/operator/value dropdowns instead of natural language: "When [title] contains [Netflix] -> set category to [Entertainment]". _Violates Principle #6._

5. **No rule preview/test.** Can't preview matching transactions before saving. The "Apply to existing?" count comes AFTER saving. _Violates Principle #4._

6. **No "create from transaction" shortcut.** No proactive entry point on transaction detail screens (only reactive suggestion after editing).

### Validation — ADEQUATE

- Zod schema via `zodResolver(RuleCreateInputSchema)` in `use-rule-form.hook.ts:65`
- Field-operator compatibility enforced by `FIELD_OPERATORS` constant
- Operator auto-resets when field changes (`rule-condition-operator-selector.tsx:25-28`)
- BETWEEN requires secondaryValue (DB CHECK constraint + form validation)

---

## 5. Rule Suggestion Flow (From Transaction Edits) — CRITICAL

### Detection Logic (`use-suggest-rule-detection.hook.ts`)

Watches `entries[0].categoryId` and `tagIds` via `useWatch`. Compares with original transaction values. Calls `computeDetectionMode()`:

```
suggest: isBankSynced && hasChanges && !ruleCreated && matchingRulesCount === 0
match:   isBankSynced && matchingRulesCount > 0
none:    everything else
```

### Current Flow — 3+ TAPS (Violates Principles #1, #3)

1. User changes category -> `RuleSuggestionPill` appears (animated, 500ms delay)
2. **Tap 1:** User taps "Quick rule" pill
3. Bottom sheet opens showing rule description
4. **Tap 2:** User taps "Create rule" button
5. If matching transactions: Alert "Apply to X existing?"
6. **Tap 3:** User taps "Apply" or "Skip"

**What it should be (1 tap):** User changes category -> inline card slides in: "Always categorize 'Netflix' as Entertainment? [Yes]" -> 1 tap creates and applies.

### Suggestion Intelligence — MODERATE

**Good:**

- Detects category AND tag changes
- Pre-fills from title, comment, MCC code
- Uses CONTAINS operator (appropriate for titles)
- Checks for duplicates via `findDuplicateRule()` before showing modal
- Handles duplicates gracefully (Edit existing / Create anyway / Cancel)

**Bad:**

- **Only detects category and tag changes.** Comment, account, title changes don't trigger. _Violates Principle #1._
- **Only for bank-synced transactions** (`computeDetectionMode.util.ts:7`). Manual transactions never get suggestions. _Violates Principle #1._
- **Includes ALL available fields as conditions.** Title + comment + MCC all become conditions (`suggest-rule-condition-fields.constant.ts`). Creates overly specific rules. _Violates Principle #2._
- **No customization before creating.** Only "Create rule" or "Cancel". No way to adjust conditions. _Violates Principle #3._

### Fatigue Prevention — MINIMAL (Violates Principle #1)

- **Duplicate detection:** Yes, via `findDuplicateRule()`. Good.
- **Previously dismissed:** No tracking. Dismissed suggestions reappear on re-render. Bad.
- **Rate limiting:** None.
- **One-off detection:** No heuristic to distinguish one-off corrections from patterns.

### Batch Edits — NOT RECOGNIZED (Violates Principle #2)

Editing 5 transactions the same way produces 5 separate suggestion pills. No cross-transaction pattern detection.

### First-Time Experience — NONE (Violates Principle #6)

No onboarding, no tooltip, no explanation of what "Quick rule" means. First-time users see a spinning cog icon with no context.

---

## 6. Rule Management (List, Edit, Delete, Reorder)

### Rules List Screen (`packages/app/src/app/(tabs)/settings/rules.tsx`)

**What's there:**

- `LegendList` with recycled items (virtualized)
- Order badge (#1, #2, etc.)
- `RuleSummaryPills` showing conditions -> actions
- Enable/disable `ThemedSwitch` toggle
- Swipe-to-delete via `DeletableRow`
- Empty state: Zap icon + "No Rules Yet" + description
- "+" create button via `useCreateAction`

**What's missing:**

| Feature                                                               | Principle Violated |
| --------------------------------------------------------------------- | ------------------ |
| Human-readable rule names (auto-generated "Netflix -> Entertainment") | #6                 |
| Match count / last triggered date                                     | #4                 |
| Drag-and-drop reordering                                              | #1, #6             |
| Inline editing (expand-in-place)                                      | #3                 |
| Search/filter                                                         | #1                 |
| Bulk operations (disable all, delete multiple)                        | #1                 |
| Rule duplication                                                      | #1                 |

### Rule Card (`rule-card.tsx`)

Compact layout: order badge | summary pills | toggle switch. Tap opens modal for editing. No inline expand.

### Empty State — ADEQUATE BUT WEAK

"No Rules Yet" with description. No illustration, no examples of what rules can do, no "Create your first rule" CTA button (only "+" in header).

---

## 7. UI/UX Deep Dive

### Animation Audit

| State Transition              | Animated?      | Method                            | Quality           |
| ----------------------------- | -------------- | --------------------------------- | ----------------- |
| Rules list items appear       | No             | Static render                     | **Violates #5**   |
| Suggestion pill appears       | Yes            | `FadeIn.delay(500).duration(200)` | Good, no spring   |
| Suggestion pill success state | Yes            | `FadeIn/FadeOut` with delays      | Good              |
| Sparkle icon rotation         | Yes            | `withTiming` 360deg, 600ms        | Linear, no spring |
| Matching rules pill appears   | Yes            | `FadeIn.delay(500).duration(200)` | Good              |
| Rule toggle switch            | Yes            | `ThemedSwitch` native             | Platform standard |
| Rule card delete (swipe)      | Yes            | `DeletableRow` gesture            | Good              |
| Form modal open/close         | Yes            | Expo Router modal                 | Platform standard |
| Conditions/actions add/remove | **No**         | Instant layout change             | **Violates #5**   |
| Rule creation success         | No celebration | Timer-based state swap            | **Violates #5**   |
| Empty -> content transition   | **No**         | Instant swap                      | **Violates #5**   |

### Micro-interactions

- Haptic on suggestion pill press: Yes (via `HapticPressable`)
- Haptic on rule creation success: Yes (`NotificationFeedbackType.Success`)
- Haptic on rule delete: Yes (via `useVibration`)
- Haptic on rule toggle: **No**
- Haptic on condition/action add/remove: **No**
- Success celebration on rule creation: Understated text + checkmark. No confetti, pulse, or satisfying animation.

### Copy & Language — MIXED

**Jargon exposed:**

- "MCC Code" — users don't know MCC codes (`rule-condition-field.constant.ts`)
- "External Source" — meaningless to non-technical users
- "Condition 1", "Condition 2" — technical framing (`rule-condition-row.tsx:29`)
- "CONTAINS" / "NOT_CONTAINS" / "MATCHES_REGEX" — programmer-oriented operator names

**Good copy:**

- "Quick rule" pill text
- "Match transactions where... then set..." in suggestion modal
- "Create rules to automatically categorize and tag your bank transactions" empty state
- "Actions to apply when conditions match" section description

---

## 8. Edge Cases & Error Handling

### Deleted Referenced Entities — SILENT BREAKAGE

Category/tag/account deletion cascades to rule actions via `ON DELETE CASCADE`. Rules can end up with zero actions. No warning, no notification, no cleanup.

### Network Drops During Sync — HANDLED

Rule application in sync wrapped in try-catch (`monobank-sync.service.ts`). Doesn't block sync. But user is never informed rules failed.

### Contradictory Rules — PARTIAL WARNING ONLY

`useHasConflictingRules` shows text warning during creation. Doesn't prevent creation. No indication on transactions which rule won.

### Null/Missing Fields — HANDLED

`evaluateRuleCondition()` returns `false` for null values (`evaluate-rule-condition.util.ts:39`). Correct behavior.

### Large Imports — NO PROGRESS

`onProgress` callback exists in `applyRuleToMatchingTransactions()` (`rule-engine.service.ts:70`) but is **never wired up** in any calling code. Users see nothing during long operations.

### Undo — NONEXISTENT

No undo for rule-applied changes. `updatedBy: RULE` tracked but never surfaced. If a rule miscategorizes 500 transactions, user must manually fix each one.

### Race Conditions — POSSIBLE

Concurrent syncs (multiple bank accounts) both call `applyRulesToTransactions`. Per-transaction DB transactions help, but no cross-call coordination for exclusive action tracking.

### Regex Safety — WELL HANDLED

`evaluate-rule-condition.util.ts:8-10`: Max 200 chars, nested quantifier detection, try-catch with `false` return on exception.

---

## 9. Testing — ZERO COVERAGE

**No unit or integration tests exist for the Rules feature.** No `*.test.ts` or `*.spec.ts` files in the rule module.

**What MUST be tested:**

1. `evaluateRuleCondition()` — all 9 operators x 7 fields, null values, case sensitivity, regex safety
2. `matchOperator()` — boundary values, empty strings, special characters
3. `buildRuleConditionSql()` — SQL generation correctness, SQL injection prevention
4. `computeDetectionMode()` — all 3 return states with all input combinations
5. `findDuplicateRule()` — case-insensitive, order-independent matching
6. `RuleEngineService.applyRulesToTransaction()` — exclusive action tracking, CONVERT_TO_TRANSFER ordering
7. `convertTransactionToTransfer()` — expense/income conversion, exchange rates, same-account rejection

**E2E selectors exist** (6 files) indicating e2e tests are planned but not written.

---

## 10. Performance

### Bottlenecks

1. **Legacy full-table scan** (`rule-matcher.service.ts:189-236`): ANY match type with AMOUNT or REGEX conditions scans all transactions. O(n) complexity.

2. **`useSuggestRuleDetection` runs `findAllMatchingRules()` on every render** (`use-suggest-rule-detection.hook.ts:56`): Evaluates ALL enabled rules synchronously on every form change. With many rules, causes lag during typing.

3. **`RuleSuggestionPill.handlePress()` queries entire rules table** (`rule-suggestion-pill.tsx:69`): `ruleRepository.findAllWithActionsAndCategories()` for duplicate detection on every pill press.

4. **Batch delay accumulation**: `RULE_BATCH_DELAY_MS=50ms` x `(transactions/20)` batches. For 1000 transactions: 2.5 seconds of pure delay time.

### Well-Optimized

- SQL-first evaluation strategy for common conditions
- MCC code map built lazily (only when MCC conditions exist)
- `Promise.allSettled` prevents cascade failures
- `LegendList` with `recycleItems` for rules list virtualization

---

## 11. Missing Features (Gap Analysis)

### Must-Have

| Feature                                                          | Competitors                      |
| ---------------------------------------------------------------- | -------------------------------- |
| Apply to past transactions (visible toggle, not post-save alert) | Monarch Money, Lunch Money, YNAB |
| Rule application summary after sync/import                       | Monarch Money, Copilot           |
| Undo after rule application                                      | Monarch Money                    |
| Auto-generated rule names ("Netflix -> Entertainment")           | All competitors                  |
| Rule ordering/priority with drag-and-drop                        | Firefly III, Lunch Money         |

### High Impact

| Feature                                      |
| -------------------------------------------- |
| One-tap rule creation from suggestion        |
| Pattern detection across transactions        |
| Rule activity log (what each rule did, when) |
| Natural language display in rule list        |
| Customization expansion on suggestion        |

### Nice-to-Have

| Feature                                                         |
| --------------------------------------------------------------- |
| Rule templates/presets for common merchants                     |
| Natural language creation ("put all Uber charges in Transport") |
| Import/export rules                                             |
| Auto-learning (detect recurring patterns, suggest proactively)  |
| Rule testing/preview before saving                              |

---

## 12. Summary & Prioritized Recommendations

### Tier 1 — Critical / Must Fix in Redesign

| #   | Issue                          | File Reference                                               | Target State                                   | Effort | Impact | Principles |
| --- | ------------------------------ | ------------------------------------------------------------ | ---------------------------------------------- | ------ | ------ | ---------- |
| 1   | Suggestion flow is 3+ taps     | `rule-suggestion-pill.tsx`, `suggest-rule-modal-content.tsx` | Inline 1-tap card with swipe-to-dismiss        | M      | High   | #1, #3     |
| 2   | No rule application summary    | `rule-engine.service.ts:48`                                  | Post-sync notification with count              | M      | High   | #4         |
| 3   | No undo after auto-application | No file exists                                               | Review screen with batch undo                  | L      | High   | #4         |
| 4   | No rule priority/ordering      | DB schema, `rules.tsx`                                       | Draggable list with persisted sort order       | M      | High   | #1, #6     |
| 5   | Technical jargon in UI         | `rule-condition-field.constant.ts`, `rule-condition-row.tsx` | Human-readable labels                          | S      | High   | #6         |
| 6   | Cascade deletion breaks rules  | `rule-action-entity.table.ts:22-23`                          | Warning dialog or SET NULL + graceful handling | M      | High   | #4         |
| 7   | Default action is ADD_TAG      | `rule-actions-section.tsx:13`                                | Default to SET_CATEGORY                        | S      | Medium | #2         |
| 8   | Zero test coverage             | No test files                                                | Tests for evaluation engine and key flows      | L      | High   | --         |

### Tier 2 — High Impact Improvements

| #   | Issue                               | File Reference                                | Target State                             | Effort | Impact | Principles |
| --- | ----------------------------------- | --------------------------------------------- | ---------------------------------------- | ------ | ------ | ---------- |
| 9   | No auto-generated rule names        | `rule-card.tsx`, `rule-summary-pills.tsx`     | "Netflix -> Entertainment" labels        | S      | Medium | #6         |
| 10  | Suggestion only for bank-synced     | `compute-detection-mode.util.ts:7`            | Detect changes on all transaction types  | S      | Medium | #1, #2     |
| 11  | No match count/last triggered       | DB schema, `rule-card.tsx`                    | Track and display statistics             | M      | Medium | #4         |
| 12  | No pattern detection                | Not implemented                               | Cross-transaction pattern recognition    | L      | High   | #2, #4     |
| 13  | Suggestion includes ALL fields      | `suggest-rule-condition-fields.constant.ts`   | Smart single-condition selection         | S      | Medium | #2         |
| 14  | No customization on suggestion      | `suggest-rule-modal-content.tsx`              | Optional expand affordance               | M      | Medium | #3         |
| 15  | No progress for "Apply to existing" | `rule-engine.service.ts:70` (unused callback) | Wire up `onProgress` to UI               | S      | Medium | #4, #5     |
| 16  | Suggestion dismissal not persisted  | `use-suggest-rule-detection.hook.ts`          | Session-based tracking                   | S      | Medium | #1         |
| 17  | No "create rule from transaction"   | Transaction detail screens                    | Proactive action button                  | S      | Medium | #1, #3     |
| 18  | Silent failures during sync         | `rule-engine.service.ts:48`                   | Log failures, surface count              | S      | Medium | #4         |
| 19  | Legacy full-table scan              | `rule-matcher.service.ts:189-236`             | SQL-level AMOUNT matching via microunits | M      | Medium | --         |

### Tier 3 — Polish & Delight

| #   | Issue                                       | File Reference                                            | Target State                             | Effort | Impact | Principles |
| --- | ------------------------------------------- | --------------------------------------------------------- | ---------------------------------------- | ------ | ------ | ---------- |
| 20  | No animation on condition/action add/remove | `rule-conditions-section.tsx`, `rule-actions-section.tsx` | Spring-based enter/exit                  | S      | Low    | #5         |
| 21  | No haptic on rule toggle                    | `rule-card.tsx:21`                                        | Light haptic feedback                    | S      | Low    | #5         |
| 22  | No skeleton on rule list load               | `rules.tsx`                                               | Skeleton shimmer if slow                 | S      | Low    | #5         |
| 23  | No first-time onboarding for suggestions    | `rule-suggestion-pill.tsx`                                | Micro-tooltip explaining "Quick rule"    | S      | Low    | #6         |
| 24  | No rule duplication                         | `rules.tsx`                                               | "Duplicate" action on card               | S      | Low    | #1         |
| 25  | No search/filter in rules list              | `rules.tsx`                                               | Search bar for 10+ rules                 | S      | Low    | #1         |
| 26  | No success celebration                      | `rule-suggestion-pill.tsx:87-98`                          | Satisfying micro-animation               | S      | Low    | #5         |
| 27  | No rule testing/preview                     | `use-rule-form.hook.ts`                                   | In-form preview of matching transactions | M      | Medium | #4         |
| 28  | Sentence-based rule form                    | `rule-form-layout.tsx`, `rule-condition-row.tsx`          | Natural language builder                 | L      | Medium | #6         |

---

## What's Done Well

- **Clean architecture:** Three-tier separation, class-based services, pure utility functions
- **Hybrid SQL+JS matching:** Smart optimization using SQL where possible (`build-rule-conditions-where.util.ts`)
- **Batch processing:** Prevents UI thread starvation (`RULE_BATCH_SIZE=20`, `RULE_BATCH_DELAY_MS=50`)
- **Exclusive action tracking:** Correct handling of SET_CATEGORY and CONVERT_TO_TRANSFER conflicts
- **Type safety:** No `any`, no type assertions, Zod validation throughout
- **Full i18n coverage:** All user-facing strings properly internationalized with Lingui
- **E2E selector infrastructure:** 6 selector files ready for test implementation
- **Duplicate detection:** Smart check before suggesting duplicate rules (`find-duplicate-rule.util.ts`)
- **Live queries:** Real-time UI updates via Drizzle's `useLiveQuery`
- **Soft delete:** Rules are archived, not hard-deleted
- **Regex safety:** Length limits (200 chars) and nested quantifier detection (`evaluate-rule-condition.util.ts:8-10`)
- **DB transaction atomicity:** All multi-step operations wrapped in `db.transaction()`
- **SQL injection prevention:** `escapeSqlLikeValue()` utility for LIKE queries

The architecture is solid enough to build on. The redesign should focus on UX improvements rather than a full rewrite.
