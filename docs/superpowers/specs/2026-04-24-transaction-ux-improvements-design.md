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
- A `Done` action in the search header resolves with the final selection.
- Sheet dismiss (swipe down / backdrop) also resolves with the current local selection (i.e. dismissing *commits*, not cancels — matches existing modal conventions for other pickers).
- `singleSelect` mode keeps its current one-tap-resolves behaviour.

### Component changes

- `tags-selector.tsx`:
  - Replace the derived selection from `initialTagIds` with `useState<number[]>(initialTagIds)`.
  - `handleSelectTag` updates local state only.
  - New `handleDone` resolves once with `selected`.
  - Add `Done (N)` right-action button (inactive if selection unchanged from `initialTagIds`).
  - On unmount/dismiss — resolve with current `selected`.

### Accessibility

- The `Done` button gets `accessibilityLabel={t\`Confirm tag selection\`}` and an `accessibilityState={{ disabled: !isDirty }}`.

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

`packages/contracts/src/transaction-tags/repository/transaction-tags.repository.ts` (new file — currently the join is managed inline by the transaction repository):

```ts
class TransactionTagsRepository {
    constructor(private db: DB) {}

    async setPrimary(transactionId: number, tagId: number, tx?: TX): Promise<void> {
        const connection = tx ?? this.db;
        await connection.transaction(async innerTx => {
            await innerTx.update(TransactionTagsEntityTable)
                .set({ isPrimary: false })
                .where(eq(TransactionTagsEntityTable.transactionId, transactionId));
            await innerTx.update(TransactionTagsEntityTable)
                .set({ isPrimary: true })
                .where(and(
                    eq(TransactionTagsEntityTable.transactionId, transactionId),
                    eq(TransactionTagsEntityTable.tagId, tagId)
                ));
        });
    }
}
```

Inserts of new tags at transaction-create time keep existing semantics; the transaction service sets `isPrimary = true` on the first row in a fresh batch and `false` on the rest. When editing an existing transaction and adding tags to a row that already has a primary, new rows insert with `isPrimary = false`.

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

**Error path:** if the repository write fails, `Haptics.Warning`, toast `t\`Couldn't update primary tag\``, revert optimistic state with `LinearTransition.springify()` (chips swap back).

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

- The transaction list query already pulls `transactionTags: true`. Extend the repository to sort tags with `orderBy: [desc(TransactionTagsEntityTable.isPrimary), asc(TransactionTagsEntityTable.tagId)]` so consumers can trust `transactionTags[0]` is primary.

---

## 4. B.4 — Preserve scroll on return from edit

### Root cause

`packages/app/src/@generic/hook/use-focus-key.hook.ts` increments a key on every `useFocusEffect`, and that key is applied to the `LegendList` inside `transaction-sections-list.tsx`. Remounting unlocks reliable data refresh but destroys scroll position.

### Fix

Drop the `key` prop on `LegendList` (it's a `LegendList`, so native-side state survives across focus events). Replace the `useFocusKey`-driven remount with a `useFocusEffect` that calls the live query's refetch (if needed) or relies on `useLiveQuery` reactivity — which already re-fires when the underlying Drizzle query changes. Remove `useFocusKey` usage from transaction list screens.

**Scope of audit:** grep for `useFocusKey` + `focusKey` across the app. Any other screen doing this for the same "reset on return" reason gets migrated to `useFocusEffect` + `refetch`. Screens that intentionally want a hard reset (e.g. an onboarding modal) keep it — each removal reviewed case by case.

**Verification:** Maestro E2E flow — load list, scroll to row 50, tap a transaction, edit amount, submit, confirm we return to row 50 visible.

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
    const { data: count = 0 } = useUncategorizedCountQuery();
    const isActive = Array.isArray(value) && value.length === 0;

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

One Drizzle migration in `packages/app/drizzle`:

```sql
-- NNNN_add_is_primary_to_transaction_tags.sql

ALTER TABLE transaction_tags ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX transaction_tags_primary_idx
  ON transaction_tags(transaction_id)
  WHERE is_primary = 1;

-- Backfill: mark the lowest tag_id per transaction as primary.
UPDATE transaction_tags
SET is_primary = 1
WHERE (transaction_id, tag_id) IN (
    SELECT transaction_id, MIN(tag_id)
    FROM transaction_tags
    GROUP BY transaction_id
);
```

Run order: `cd packages/contracts && yarn build` → `cd packages/app && yarn db:generate` → verify generated migration against the SQL above → commit.

---

## 7. Testing

- **Types:** `yarn ts` across `app` and `contracts`.
- **Lint:** `yarn lint`, `yarn deadcode`, `yarn cpd`.
- **Maestro E2E (manual run):**
  - Create transaction, add 3 tags in one sheet open (A.2).
  - Long-press a non-primary tag on the list card, verify the morph + promotion (A.3).
  - Scroll list to ~row 50, tap a transaction, edit, submit, confirm scroll preserved (B.4).
  - Create an uncategorized transaction, confirm chip appears; tap it, confirm filter applied; tap again, confirm cleared (B.5).
- **Manual visual QA:** dark mode + light mode for the new chip + the inline morph.

---

## 8. Rollout

Single PR titled `feat(app): transaction ux improvements — tag primary, scroll, uncategorized filter`. No feature flag — the changes are incremental and reversible via a revert.

---

## 9. File manifest

**Contracts:**
- `src/transaction-tags/table/transaction-tags-entity.table.ts` — add `isPrimary`, partial unique index.
- `src/transaction-tags/repository/transaction-tags.repository.ts` — new file with `setPrimary`.
- `src/index.ts` — export new repository.

**App:**
- `drizzle/NNNN_add_is_primary_to_transaction_tags.sql` — new migration.
- `src/app/tags-selector.tsx` — rework to local state + Done action.
- `src/transaction/components/transaction-card-tag/*` — delete (replaced).
- `src/transaction/components/transaction-card-tags/transaction-card-tags.tsx` — new.
- `src/transaction/components/transaction-card-tags-inline-picker/transaction-card-tags-inline-picker.tsx` — new.
- `src/transaction/components/transaction-card-tag-chip/transaction-card-tag-chip.tsx` — new.
- `src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.tsx` — new.
- `src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.selector.ts` — test IDs.
- `src/transaction/components/transaction-filters/transaction-filters.tsx` — insert new chip first.
- `src/transaction/query/use-uncategorized-count.query.ts` — new.
- `src/transaction/hook/use-promote-primary-tag.hook.ts` — new.
- `src/transaction/components/transaction-card/transaction-card.tsx` — swap `TransactionCardTag` → `TransactionCardTags`.
- `src/@generic/hook/use-focus-key.hook.ts` — audit usage; remove from transaction list screens.
- `src/transaction/components/transaction-sections-list/transaction-sections-list.tsx` — drop `key={focusKey}`.

Any changes outside this manifest that emerge during implementation must be called out in the PR description.

---

## 10. Open questions

None blocking. Noted for the writing-plans step: confirm `UserIconNameEnum.CircleDashed` exists (fallback identified above).
