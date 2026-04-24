# Transaction UX Improvements — Design

**Date:** 2026-04-24
**Scope:** Two clusters of UX fixes in `packages/app`: Tag UX (cluster A) and List UX (cluster B).
**Out of scope:** Rules engine (cluster C) — deferred to a separate spec.

---

## 1. Goals

Ship four tightly-scoped improvements that remove daily friction in the transaction flow:

- **A.2** — Multi-tag selector keeps the sheet open across selections.
- **A.3** — `isPrimary` flag on `transaction_tags` + a delightful long-press-to-promote interaction on the card (only when a transaction has more than one tag).
- **B.4** — Scroll position on the transactions list is preserved when returning from transaction edit.
- **B.5** — An "Uncategorized" filter chip appears as the first chip in the filter row whenever at least one transaction has no category.

Non-goals: Tag ordering beyond primary/non-primary. "Select all" on AI tag suggestions (dropped during brainstorming). Rules engine. Category auto-assignment.

---

## 2. A.2 — Tag selector stays open

### Current behaviour

`packages/app/src/app/tags-selector.tsx:41-48` calls `resolveTagsSelector(...)` on every chip tap. The selector is promise-based — resolving closes the sheet. The caller re-opens it with updated `initialTagIds`, giving a jarring flicker on every selection.

### New behaviour

- The selector owns local selection state.
- Chip taps update local state with haptic `Selection` + a 150ms chip scale pulse (1 → 0.96 → 1).
- A `Done` floating pill at the bottom of the sheet resolves with the final selection.
- Sheet dismiss (swipe down / backdrop) also resolves with the current local selection (i.e. dismissing *commits*, not cancels — matches existing modal conventions for other pickers).
- `singleSelect` mode keeps its current one-tap-resolves behaviour.

### Done button placement — explicit decision

`SelectorModalSearchHeader` has exactly one `rightActionIcon` / `rightActionOnPress` slot, which the tag selector already uses for the `+` (create tag) action. We do **not** extend the shared header — adding a second action to a component used by many selectors would force a pattern change we don't need elsewhere.

Instead we render a new `TagsSelectorDoneButton` component as a floating, bottom-anchored pill inside `tags-selector.tsx` (below the `TagsSelectContent` grid, positioned with `position: 'absolute'` + `bottom: insets.bottom + md`, centred). The pill follows the `bg-primary` active-chip palette and uses `HapticPressable`. The pill is **only mounted** when the selection is dirty (i.e. differs from `initialTagIds` by identity or length). When clean, it unmounts with `FadeOutDown.duration(160)`; when it becomes dirty it mounts with `FadeInUp.springify()`.

This turns the button's visibility itself into the disabled-state indicator, avoiding a `disabled` prop on a new or existing component.

### Component changes

- `tags-selector.tsx`:
  - Replace the derived selection from `initialTagIds` with `useState<number[]>(initialTagIds)`.
  - `handleSelectTag` updates local state only.
  - New `handleDone` resolves once with `selected` (called by the floating pill and by the dismiss lifecycle).
  - On dismiss — resolve with current `selected`. The tag selector modal is mounted via the formsheet modal provider; we hook into the sheet's `onDismiss` callback (the same path that resolves modals today when the user swipes). The spec's companion implementation plan must verify the exact prop name in the modal provider and route the dismiss through `handleDone`.
- `tags-selector-done-button/tags-selector-done-button.tsx` (new):
  - Props: `count: number`, `onPress: EmptyFn`.
  - Renders `Done (N)` via `` t`Done (${count})` ``.
  - Wrapped in `Animated.View` with `FadeInUp.springify()` / `FadeOutDown.duration(160)`.

### Accessibility

- The floating Done pill gets `accessibilityRole="button"` and `accessibilityLabel={t\`Confirm tag selection\`}`. Visibility-based disabled state — VoiceOver users only encounter the button when it is interactive.

---

## 3. A.3 — Primary tag + inline long-press-to-promote

### 3.1 Schema

Add `isPrimary` to `transaction_tags`:

```ts
// packages/contracts/src/transaction-tags/table/transaction-tags-entity.table.ts
export const TransactionTagsEntityTable = sqliteTable(
    'transaction_tags',
    {
        transactionId: int('transaction_id', { mode: 'number' })
            .references(() => TransactionEntityTable.id, { onDelete: 'cascade' })
            .notNull(),
        tagId: int('tag_id', { mode: 'number' })
            .references(() => TagEntityTable.id, { onDelete: 'cascade' })
            .notNull(),
        isPrimary: int('is_primary', { mode: 'boolean' }).notNull().default(false)
    },
    ({ transactionId, tagId, isPrimary }) => [
        primaryKey({ columns: [transactionId, tagId] }),
        index('transaction_tags_tag_idx').on(tagId),
        uniqueIndex('transaction_tags_primary_idx').on(transactionId).where(sql`${isPrimary} = 1`)
    ]
);
```

**Invariant:** at most one row per `transactionId` has `isPrimary = 1`. Enforced by the partial unique index plus a transactional `setPrimary` operation.

**Backfill (migration):** For every existing transaction with ≥1 tag, set `isPrimary = 1` on the row with the lowest `tagId`. Transactions with zero tags are unaffected. Emitted as SQL in the Drizzle migration file so re-running the app post-upgrade is deterministic.

### 3.2 Repository

`packages/contracts/src/transaction-tags/repository/transaction-tags.repository.ts` already exists. We add a `setPrimary` method matching the codebase's repository conventions: parameter type is `DB` (not `TX` — this codebase only exports `DB`), and the method does **not** call `.transaction(...)` itself because `expo-sqlite` forbids nested transactions (documented in `packages/contracts/CLAUDE.md`). The caller owns the outer transaction; `setPrimary` executes two sequential `UPDATE`s on whichever connection it's given.

```ts
async setPrimary(transactionId: number, tagId: number, tx?: DB): Promise<void> {
    const connection = tx ?? this.db;

    await connection.update(TransactionTagsEntityTable)
        .set({ isPrimary: false })
        .where(eq(TransactionTagsEntityTable.transactionId, transactionId));

    await connection.update(TransactionTagsEntityTable)
        .set({ isPrimary: true })
        .where(and(
            eq(TransactionTagsEntityTable.transactionId, transactionId),
            eq(TransactionTagsEntityTable.tagId, tagId)
        ));
}
```

Callers must wrap `setPrimary` in `db.transaction(async tx => repo.setPrimary(transactionId, tagId, tx))` for atomicity. The promote hook (Section 3.4) does this at the app layer.

**Insert-time semantics.** Adding `isPrimary` to the create schema changes what the transaction service writes at creation time. See Section 3.8 for the schema + util chain. Summary: the service sets `isPrimary = true` on the first element of a fresh tag batch, `false` on the rest. When adding tags to a transaction that already has a primary, new rows insert with `isPrimary = false` — the existing primary is preserved.

**Primary removal.** When the current primary tag is removed from a transaction via the selector flow (the existing delete + re-insert path), the transaction service must promote the first surviving row to primary within the same `db.transaction(...)`. If all tags are removed, no primary exists (normal empty state).

### 3.3 Card display

Replace `transaction-card-tag/transaction-card-tag.tsx` (singular) with `transaction-card-tags/transaction-card-tags.tsx` (plural). The new component:

- 0 tags → renders `null`.
- 1 tag → renders a single tag chip (icon + text, same styling as today) with no gesture handler.
- ≥2 tags → renders primary chip + a muted `+N` badge next to it.
  - The primary chip owns the long-press handler.
  - `+N` is a small pill: `rounded-full border border-secondary-corner px-sm text-xs text-secondary-foreground`.

Primary is sorted to index 0 in the ordered array derived from `transaction.transactionTags` (lookup via `isPrimary` flag; fallback to the first join row if the invariant is violated — defensive only).

### 3.4 Inline long-press morph

The interaction happens *on the card itself* — no modal, no sheet. When the user long-presses the primary chip, the entire tag row morphs into a mini picker showing all tags, then collapses back.

**Files added:**

- `transaction/components/transaction-card-tags/transaction-card-tags.tsx` — orchestrator.
- `transaction/components/transaction-card-tags-inline-picker/transaction-card-tags-inline-picker.tsx` — expanded row.
- `transaction/components/transaction-card-tag-chip/transaction-card-tag-chip.tsx` — individual chip with optional `isPrimary` and `isSelectable` props.
- `transaction/hook/use-promote-primary-tag.hook.ts` — wraps the repository call + toast + optimistic local update.

**Tech stack for the animation:**

- `react-native-gesture-handler` `Gesture.LongPress()` with `minDuration={350}`.
- `react-native-reanimated` for shared values, `LinearTransition.springify()` for reflow, `FadeInRight` / `FadeOutLeft` for chip entry/exit.
- `expo-haptics` for tactile feedback.

**Interaction timeline:**

| t (ms) | Event | Feedback |
|---|---|---|
| 0 | `onBegin` | `Haptics.Light`. Primary chip scales 1 → 1.04 with spring (damping 12, stiffness 300). A 1px `border-primary` ring cross-fades in. |
| 350 | `onStart` (hold complete) | `Haptics.Medium`. `+N` badge scales to 0 over 120ms. Sibling chips materialise, staggered 30ms apart (`FadeInRight.springify()`). Card background dims 20% (`bg-overlay/20`, 180ms). Primary chip gets a soft glow (shadow-sm, primary/40). |
| on tap of non-primary chip | — | `Haptics.Selection`. Tapped chip grows a `border-primary` ring over 180ms, then reflows to lead position via `LinearTransition.springify()`. Old primary demotes and drops back to natural sort order. Optimistic update commits instantly. |
| after commit, +150ms | — | Siblings `FadeOutLeft` (stagger reversed). `+N` badge springs back in. Card background fades back. |
| any time | Tap outside / swipe / 3s idle | Same collapse animation. |

**Error path and rollback:** `usePromotePrimaryTag` owns the optimistic state. The hook keeps a local ref to the previous primary `tagId` captured immediately before the write (closure over the row array at call time). On write failure, the hook writes the previous primary back to its local Reanimated shared values + triggers a Toast with `Haptics.Warning` and `t\`Couldn't update primary tag\``. The `LinearTransition.springify()` reflow handles the visual swap-back automatically because the sorted array returns to its prior state. The `useLiveQuery` subscription is the source of truth; the hook only holds the rollback snapshot for the duration of the write.

**When `tags.length === 1`:**

- No gesture handler is attached — the long-press is a no-op.
- No `+N` badge. No glow. The chip behaves exactly like today.

### 3.5 Accessibility

- The primary chip exposes `accessibilityActions={[{ name: 'promote', label: t\`Change primary tag\` }]}` when `tags.length > 1`.
- VoiceOver users triggering the action open a system-native action sheet listing sibling tags; tapping one calls `setPrimary`. This replaces the visual morph for non-gestural users.

### 3.6 Edge cases

- Adding a tag via the tag selector to a transaction with no primary yet → new tag is set `isPrimary = true`.
- Removing the current primary tag → the next-lowest-`tagId` surviving row is promoted atomically in the same transaction.
- Legacy rows after migration → backfill ensures exactly one `isPrimary = 1` per transaction with tags.

### 3.7 Data flow

- The transaction list query already pulls `transactionTags: true` via `TRANSACTION_FULL_RELATIONS`. Drizzle's nested `with:` API does not support `orderBy` on a relation, so we do **not** attempt to sort at the query level.
- Instead we introduce a helper `sortTransactionTagsByPrimary(transactionTags)` in `packages/app/src/transaction/utils/sort-transaction-tags-by-primary.util.ts` that sorts `[desc(isPrimary), asc(tagId)]`. `TransactionCardTags` and any consumer that needs primary-first ordering calls this helper on its input.
- Keeping the sort in app code is consistent with other utility-first patterns in the codebase (see `transaction/utils/*`) and avoids a hand-rolled SQL query.

### 3.8 Create-schema and insert utility chain

The schema and util chain around `TransactionTagsCreateEntitySchema` must be updated so `isPrimary` is actually set at insert time. Without this, the DB column's `DEFAULT 0` means no new tag ever becomes primary on create.

**Files to update:**

- `packages/contracts/src/transaction-tags/schema/transaction-tags-create-entity.schema.ts` — the `.pick({ transactionId: true, tagId: true })` must become `.pick({ transactionId: true, tagId: true, isPrimary: true })`. The inferred `TransactionTagsCreateEntityInterface` gains `isPrimary: boolean`.
- `packages/app/src/transaction/utils/transaction-map-tag-ids-to-create-entities.util.ts` — currently maps to `{ transactionId, tagId }`. New signature takes an optional `existingPrimaryTagId: number | null` parameter. Semantics:
  - If `existingPrimaryTagId` is `null` (no existing primary), the first element of the output gets `isPrimary: true`, rest get `false`.
  - If `existingPrimaryTagId` is set, every new row gets `isPrimary: false` (existing primary is preserved).
- Callers of the util: update the transaction create-service and the tag-add flow in the edit-service to pass the correct `existingPrimaryTagId`.
- Tag-removal flow in the edit-service: detect if the removed tag was primary; if so and at least one tag survives, sort the surviving `tagId`s ascending and call `transactionTagsRepository.setPrimary(transactionId, sortedSurvivingTagIds[0], tx)` inside the same `db.transaction(...)`. The "lowest `tagId` wins" rule matches the migration backfill in Section 6, so the promotion is deterministic and consistent across creation, migration, and removal paths.

---

## 4. B.4 — Preserve scroll on return from edit

### Root cause

`packages/app/src/@generic/hook/use-focus-key.hook.ts` increments a key on every `useFocusEffect`, and that key is applied to the `LegendList` inside `transaction-sections-list.tsx`. Remounting unlocks reliable data refresh but destroys scroll position.

### Root cause (fuller picture)

`focusKey` flows through four touch-points in the transactions list, not just the `LegendList` key:

1. `packages/app/src/app/(tabs)/transactions.tsx` — calls `useFocusKey()` and forwards the resulting `focusKey` to `TransactionList`.
2. `packages/app/src/transaction/components/transaction-list/transaction-list.tsx` — passes `focusKey` to `useGetTransactionsQuery(activeFilters, focusKey)` as the `refreshKey` parameter AND forwards it to `TransactionSectionsList`.
3. `packages/app/src/transaction/query/use-get-transactions.query.ts` — uses `refreshKey` both as a `useLiveQuery` dependency AND inside a `useEffect` that resets `loadedCount` to `DEFAULT_LIMIT` (20).
4. `packages/app/src/transaction/components/transaction-sections-list/transaction-sections-list.tsx` — applies `key={focusKey}` to `LegendList`.

Dropping only the `LegendList` key preserves scroll position visually, but the `refreshKey`-driven `useEffect` inside `useGetTransactionsQuery` still resets `loadedCount` to 20 on every focus event. The user would return to their previous scroll position in a list whose data has been truncated, producing a broken view.

### Fix

Remove `focusKey` from the transactions list pipeline entirely. Pagination reset must remain tied to *filter changes* (which is what the user intends — start at page 1 when filters change), not to focus events.

**Concrete edits:**

- `packages/app/src/transaction/query/use-get-transactions.query.ts` — drop the `refreshKey` parameter from the function signature. The `useEffect` that resets `loadedCount` should depend only on `activeFilters` (already the correct semantic trigger). The `useLiveQuery` dependency list drops `refreshKey` as well — `useLiveQuery` already re-runs when the underlying Drizzle query changes.
- `packages/app/src/transaction/components/transaction-list/transaction-list.tsx` — drop the `focusKey` prop and stop forwarding it. Drop the argument from the `useGetTransactionsQuery` call.
- `packages/app/src/transaction/components/transaction-sections-list/transaction-sections-list.tsx` — drop the `focusKey` prop and the `key={focusKey}` on `LegendList`.
- `packages/app/src/app/(tabs)/transactions.tsx` — drop the `useFocusKey()` call and the `focusKey` prop on `TransactionList`.

**Scope of audit (explicit):** `useFocusKey` still has a legitimate consumer:

- `packages/app/src/transaction/hook/use-recurring-calendar.hook.ts` — **leave untouched**. Uses `focusKey` as a `useEffect` dependency to re-run a service call when the recurring calendar screen regains focus. Its purpose is refetch, not remount. Replacing it with `useFocusEffect` + `refetch` is a separate refactor outside this spec.
- `src/@generic/hook/use-focus-key.hook.ts` — **keep**. Still used by the recurring calendar hook.

**Verification:**

- Maestro E2E: load transactions list, scroll to ~row 50, tap a transaction, edit amount, submit; confirm scroll position lands back at row 50 and the list still has ≥50 rows loaded.
- Separately: apply a filter → confirm pagination resets to the first page (this is the intended behaviour of the `useEffect` on `activeFilters`).
- Regression check: open recurring calendar screen, navigate away, return; confirm it still refreshes.

---

## 5. B.5 — "Uncategorized" filter chip

### New files

- `transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.tsx`
- `transaction/query/use-uncategorized-count.query.ts`

### Count query

`useUncategorizedCountQuery()` — live query returning `number`:

```ts
const query = db.select({ count: sql<number>`COUNT(*)` })
    .from(TransactionEntityTable)
    .where(and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.categoryId)));
```

Wrapped in `useLiveQuery` so the chip updates live as transactions are categorised.

### Chip component

```tsx
interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionUncategorizedFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const { data: count = 0 } = useUncategorizedCountQuery();
    const isActive = isEmptyArray(value);

    if (count === 0 && !isActive) { return null; }

    const handlePress = () => onChange(isActive ? null : []);

    return (
        <Animated.View entering={FadeInLeft.springify()} exiting={FadeOutLeft.duration(180)}>
            <HapticPressable
                className={chipVariants({ isActive })}
                onPress={handlePress}
                testID={TransactionUncategorizedFilterSelector.Chip}
            >
                <Icon icon={UserIconNameEnum.CircleDashed} size={14} className={textVariants({ isActive })} />
                <Text className={textVariants({ isActive })}>{t`Uncategorized (${count})`}</Text>
            </HapticPressable>
        </Animated.View>
    );
};
```

**CVA variants** (match the existing `transaction-filter-chip` grammar; warning palette when inactive to pull attention):

```ts
const chipVariants = cva('rounded-2xl border px-xl flex-row items-center gap-x-sm py-sm', {
    variants: {
        isActive: {
            true: 'border-primary bg-primary',
            false: 'border-warning-corner bg-warning-background'
        }
    }
});

const textVariants = cva('text-sm', {
    variants: {
        isActive: {
            true: 'text-primary-reverse',
            false: 'text-warning-foreground'
        }
    }
});
```

### Integration

`transaction-filters.tsx` — render `<TransactionUncategorizedFilter value={filters.categoryIds} onChange={createFilterHandler('categoryIds')} />` as the first child inside the horizontal `ScrollView`, before `DateFilter`.

### Mutual exclusion with category filter

`categoryIds` is shared state. Setting it to `[]` (uncategorized) naturally overwrites any `[1, 2]` selection from `TransactionCategoryFilter`, and vice-versa. No extra code needed — this is baked into `BaseTransactionFilterRepository.buildCategoryCondition`.

### Icon

Use `UserIconNameEnum.CircleDashed` if it exists in the enum; fall back to `Tag` with a slash overlay. Verify during implementation.

### Accessibility

- `accessibilityRole="button"`, `accessibilityLabel={t\`Filter by uncategorized transactions\``, `accessibilityState={{ selected: isActive }}`.

### Motion

- Chip mounts with `FadeInLeft.springify()` when count transitions 0 → 1+ (or when already mounted and count changes, a subtle scale pulse on the count text — 1 → 1.15 → 1, 300ms).
- Chip exits with `FadeOutLeft.duration(180)` when count falls to 0 while inactive.

---

## 6. Data migrations

One Drizzle migration in `packages/app/drizzle`. The file name is produced by `yarn db:generate` (e.g. `0023_...sql`); the content is the Drizzle-generated `ALTER TABLE` + partial unique index, followed by a **manually-appended backfill** (Drizzle does not emit backfill SQL):

```sql
-- generated by yarn db:generate
ALTER TABLE transaction_tags ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX transaction_tags_primary_idx
  ON transaction_tags(transaction_id)
  WHERE is_primary = 1;

-- manually appended: backfill lowest tag_id per transaction as primary.
UPDATE transaction_tags
SET is_primary = 1
WHERE (transaction_id, tag_id) IN (
    SELECT transaction_id, MIN(tag_id)
    FROM transaction_tags
    GROUP BY transaction_id
);
```

Run order: `cd packages/contracts && yarn build` → `cd packages/app && yarn db:generate` → open the newly-created migration file, verify the `ALTER`/`CREATE INDEX` match the spec, append the backfill `UPDATE` — → rebuild the app bundle → commit migration + snapshot JSON.

---

## 7. Testing

- **Types:** `yarn ts` across `app` and `contracts`.
- **Lint:** `yarn lint`, `yarn deadcode`, `yarn cpd`.
- **i18n:** `yarn i18n:sync` after any user-facing string change. Commit both `.po` and `.ts` updates.
- **Build order:** `cd packages/contracts && yarn build` → `cd packages/app && yarn db:generate` → verify migration SQL, add backfill `UPDATE`, rebuild, run app.
- **Maestro E2E (manual run):**
  - Create transaction, add 3 tags in one sheet open, confirm sheet stays open until Done (A.2).
  - Long-press a non-primary tag on the list card, verify the morph + promotion + card reflow (A.3).
  - Scroll list to ~row 50, tap a transaction, edit amount, submit, confirm scroll preserved (B.4).
  - Open recurring calendar screen, leave and return, confirm it still refreshes (B.4 regression check).
  - Create an uncategorized transaction, confirm chip appears; tap it, confirm filter applied; tap again, confirm cleared; categorise the transaction, confirm chip disappears (B.5).
- **Manual visual QA:** dark mode + light mode for the new chip, the inline morph, and the floating Done pill.

---

## 8. Rollout

Single PR titled `feat(app): transaction ux improvements — tag primary, scroll, uncategorized filter`. No feature flag — the changes are incremental and reversible via a revert.

---

## 9. File manifest

**Contracts (edits):**
- `src/transaction-tags/table/transaction-tags-entity.table.ts` — add `isPrimary`, partial unique index.
- `src/transaction-tags/repository/transaction-tags.repository.ts` — add `setPrimary(transactionId, tagId, tx?: DB)` (no inner `db.transaction`). File already exists.
- `src/transaction-tags/schema/transaction-tags-create-entity.schema.ts` — add `isPrimary` to the `.pick(...)`.
- `src/transaction-tags/entity/transaction-tags-create-entity.interface.ts` — regenerated from schema (no manual edit needed, but verify).

**App — new files:**
- `drizzle/<generated>_add_is_primary_to_transaction_tags.sql` — migration produced by `yarn db:generate`; manually add the backfill `UPDATE` below the Drizzle-generated `ALTER TABLE` + index statements (Drizzle does not generate backfill SQL).
- `src/transaction/components/transaction-card-tags/transaction-card-tags.tsx` — orchestrator.
- `src/transaction/components/transaction-card-tags-inline-picker/transaction-card-tags-inline-picker.tsx` — expanded row.
- `src/transaction/components/transaction-card-tag-chip/transaction-card-tag-chip.tsx` — individual chip.
- `src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.tsx` — new chip.
- `src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.selector.ts` — test IDs.
- `src/tag/components/tags-selector-done-button/tags-selector-done-button.tsx` — floating Done pill. Filed under the `tag` entity module (consistent with `tags-select-content` at `src/tag/components/tags-select-content/`), not the `transaction` module, since the Done button belongs to the tag-selector surface.
- `src/transaction/query/use-uncategorized-count.query.ts` — live count query.
- `src/transaction/hook/use-promote-primary-tag.hook.ts` — promote handler with optimistic rollback.
- `src/transaction/utils/sort-transaction-tags-by-primary.util.ts` — `[desc(isPrimary), asc(tagId)]` sort helper.

**App — edits:**
- `src/app/tags-selector.tsx` — rework to local state + Done pill + dismiss-resolves pathway.
- `src/transaction/components/transaction-filters/transaction-filters.tsx` — insert `TransactionUncategorizedFilter` as the first child of the ScrollView.
- `src/transaction/components/transaction-card-content/transaction-card-content.tsx` — swap `TransactionCardTag` → `TransactionCardTags`.
- `src/transaction/components/transaction-sections-list/transaction-sections-list.tsx` — drop `key={focusKey}` on the `LegendList`.
- `src/transaction/utils/transaction-map-tag-ids-to-create-entities.util.ts` — accept `existingPrimaryTagId: number | null`, set `isPrimary` accordingly.
- Transaction create-service and edit-service (file paths TBD during plan-writing) — pass `existingPrimaryTagId` through; on primary-tag removal promote the first survivor inside the same `db.transaction(...)`.

**App — delete:**
- `src/transaction/components/transaction-card-tag/*` — replaced by `TransactionCardTags` + `TransactionCardTagChip`.

**Unchanged (explicitly noted):**
- `src/@generic/hook/use-focus-key.hook.ts` — kept. Still used by the recurring calendar hook.
- `src/transaction/hook/use-recurring-calendar.hook.ts` — kept. Its `useFocusKey` usage is out of scope.

**i18n:**
- New strings: `` t`Uncategorized (${count})` ``, `` t`Done (${count})` ``, `` t`Confirm tag selection` ``, `` t`Change primary tag` ``, `` t`Couldn't update primary tag` ``. Run `yarn i18n:sync` after wiring. Commit both `.po` and `.ts` changes.

Any changes outside this manifest that emerge during implementation must be called out in the PR description.

---

## 10. Open questions

None blocking.

**Confirmed during spec review (no follow-up required):**
- `UserIconNameEnum.CircleDashed` exists — no fallback needed.
- `TRANSACTION_FULL_RELATIONS` already pulls `transactionTags` with tag details.
- The `buildCategoryCondition` empty-array branch produces the correct `IS NULL` filter for B.5.

**For writing-plans to nail down (not blockers):**
- The exact `onDismiss` / lifecycle hook on the formsheet modal provider for the tag selector. Walk `packages/app/src/@generic/provider/modal-provider.tsx` (or equivalent) to pick the right integration point.
- File paths of the transaction create-service and edit-service that call `transactionMapTagIdsToCreateEntities` and delete tags — captured while producing the step-by-step plan.
