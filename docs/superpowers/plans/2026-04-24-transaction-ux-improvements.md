# Transaction UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four tightly-scoped UX fixes — tag selector stays open; primary tag flag + long-press promote on transaction cards; transactions-list scroll preserved on return from edit; "Uncategorized" filter chip.

**Architecture:** Add `isPrimary` to `transaction_tags` with a partial unique index and a repository `setPrimary` method. Update the create-util chain so the field is set at insert time. New `TransactionCardTags` orchestrates an inline long-press morph via Reanimated layout transitions. Remove `focusKey` from the transactions-list pipeline and tie pagination reset to filter changes. Add a live `useUncategorizedCountQuery` and a new filter chip as the first element in the ScrollView.

**Tech Stack:** Expo 54, React 19 + Compiler, Drizzle ORM (expo-sqlite), `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, NativeWind 5, CVA, Lingui 5.7, `@rnw-community/shared`.

**Validation model:** This codebase has no unit tests (CLAUDE.md rule 27). Each task ends with a subset of `yarn format`, `yarn ts`, `yarn lint`, `yarn deadcode`, `yarn cpd`. The final task runs the full suite and a manual Maestro E2E pass.

---

## File Structure

**Contracts package:**
- `src/transaction-tags/table/transaction-tags-entity.table.ts` — add `isPrimary` + partial unique index (edit).
- `src/transaction-tags/schema/transaction-tags-create-entity.schema.ts` — add `isPrimary` to `.pick(...)` (edit).
- `src/transaction-tags/repository/transaction-tags.repository.ts` — add `setPrimary` + `findPrimaryByTransactionId` (edit).

**App package — contracts consumer updates:**
- `packages/app/drizzle/<generated>_add_is_primary_to_transaction_tags.sql` — migration (generated + manual backfill append).
- `src/transaction/utils/transaction-map-tag-ids-to-create-entities.util.ts` — accept `existingPrimaryTagId` (edit).
- `src/transaction/utils/sort-transaction-tags-by-primary.util.ts` — new.
- `src/transaction/service/transaction.service.ts` — capture existing primary before delete; pass to mapper (edit).
- `src/transaction/service/transaction-batch-create.service.ts` — pass `null` for batch creates (edit).

**App package — A.3 components (primary tag + long-press morph):**
- `src/transaction/components/transaction-card-tag-chip/transaction-card-tag-chip.tsx` — new.
- `src/transaction/components/transaction-card-tags-inline-picker/transaction-card-tags-inline-picker.tsx` — new.
- `src/transaction/components/transaction-card-tags/transaction-card-tags.tsx` — new orchestrator.
- `src/transaction/hook/use-promote-primary-tag.hook.ts` — new.
- `src/transaction/components/transaction-card-content/transaction-card-content.tsx` — swap import (edit).
- `src/transaction/components/transaction-card-tag/transaction-card-tag.tsx` + `/transaction-card.selector.ts` test-id — delete the old single-tag component.

**App package — A.2 (tag selector):**
- `src/tag/components/tags-selector-done-button/tags-selector-done-button.tsx` — new.
- `src/app/tags-selector.tsx` — local state, Done pill, dismiss-commits cleanup (edit).

**App package — B.4 (scroll preservation):**
- `src/transaction/query/use-get-transactions.query.ts` — drop `refreshKey`; reset pagination on filter change instead (edit).
- `src/transaction/components/transaction-list/transaction-list.tsx` — drop `focusKey` prop (edit).
- `src/transaction/components/transaction-sections-list/transaction-sections-list.tsx` — drop `focusKey` prop + `key={focusKey}` (edit).
- `src/app/(tabs)/transactions.tsx` — drop `useFocusKey()` + prop (edit).

**App package — B.5 (uncategorized filter):**
- `src/transaction/query/use-uncategorized-count.query.ts` — new.
- `src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.tsx` — new.
- `src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.selector.ts` — new test-id enum.
- `src/transaction/components/transaction-filters/transaction-filters.tsx` — insert chip first (edit).

**i18n:**
- `packages/app/locales/*/messages.po` + `messages.ts` — new strings via `yarn i18n:sync`.

---

## Task 1: Add `isPrimary` column + partial unique index to the contracts table

**Files:**
- Modify: `packages/contracts/src/transaction-tags/table/transaction-tags-entity.table.ts`

- [ ] **Step 1: Replace the table definition with the new column and index**

Open the file and replace its entire contents with:

```ts
import { sql } from 'drizzle-orm';
import { index, int, primaryKey, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

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
        uniqueIndex('transaction_tags_primary_idx')
            .on(transactionId)
            .where(sql`${isPrimary} = 1`)
    ]
);
```

- [ ] **Step 2: Run contracts type check**

```bash
cd packages/contracts && yarn ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/contracts/src/transaction-tags/table/transaction-tags-entity.table.ts
git commit -m "feat(contracts): add isPrimary to transaction_tags table"
```

---

## Task 2: Update the create-entity schema to include `isPrimary`

**Files:**
- Modify: `packages/contracts/src/transaction-tags/schema/transaction-tags-create-entity.schema.ts`

- [ ] **Step 1: Include `isPrimary` in the pick**

Replace the file contents with:

```ts
import { TransactionTagsEntitySchema } from './transaction-tags-entity.schema';

export const TransactionTagsCreateEntitySchema = TransactionTagsEntitySchema.pick({
    transactionId: true,
    tagId: true,
    isPrimary: true
});
```

- [ ] **Step 2: Type check**

```bash
cd packages/contracts && yarn ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/contracts/src/transaction-tags/schema/transaction-tags-create-entity.schema.ts
git commit -m "feat(contracts): include isPrimary in transaction tags create schema"
```

---

## Task 3: Add `setPrimary` and `findPrimaryByTransactionId` to the repository

**Files:**
- Modify: `packages/contracts/src/transaction-tags/repository/transaction-tags.repository.ts`

- [ ] **Step 1: Replace the file with the extended class**

```ts
import { and, eq } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { TransactionTagsCreateEntityInterface } from '../entity/transaction-tags-create-entity.interface';
import { TransactionTagsEntityInterface } from '../entity/transaction-tags-entity.interface';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export class TransactionTagsRepository {
    constructor(private db: DB) {}

    async bulkCreate(inputs: TransactionTagsCreateEntityInterface[], tx?: DB): Promise<TransactionTagsEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionTagsEntityTable).values(inputs).returning();
        }

        return [];
    }

    async deleteByTransactionId(id: number, tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, id));
    }

    async findPrimaryByTransactionId(transactionId: number, tx?: DB): Promise<TransactionTagsEntityInterface | undefined> {
        const [row] = await (tx ?? this.db)
            .select()
            .from(TransactionTagsEntityTable)
            .where(and(eq(TransactionTagsEntityTable.transactionId, transactionId), eq(TransactionTagsEntityTable.isPrimary, true)))
            .limit(1);

        return row;
    }

    async setPrimary(transactionId: number, tagId: number, tx?: DB): Promise<void> {
        const connection = tx ?? this.db;

        await connection
            .update(TransactionTagsEntityTable)
            .set({ isPrimary: false })
            .where(eq(TransactionTagsEntityTable.transactionId, transactionId));

        await connection
            .update(TransactionTagsEntityTable)
            .set({ isPrimary: true })
            .where(and(eq(TransactionTagsEntityTable.transactionId, transactionId), eq(TransactionTagsEntityTable.tagId, tagId)));
    }

    async truncate(): Promise<void> {
        await this.db.delete(TransactionTagsEntityTable);
    }
}
```

Note: public methods come before private (there are none private here); alphabetical-within-groups matches the existing class ordering.

- [ ] **Step 2: Build contracts so the app picks up the new API**

```bash
cd packages/contracts && yarn build
```

Expected: build succeeds.

- [ ] **Step 3: Type check contracts + app**

```bash
cd packages/contracts && yarn ts
cd ../app && yarn ts
```

Expected: both clean. If the app fails to compile because existing `bulkCreate` callers now need `isPrimary` on their inputs, that's the signal to move on — subsequent tasks fix those callers.

If the app compile does fail only on `isPrimary` in `transactionMapTagIdsToCreateEntities` callers, proceed. Any other error must be addressed before committing.

- [ ] **Step 4: Commit**

```bash
git add packages/contracts/src/transaction-tags/repository/transaction-tags.repository.ts
git commit -m "feat(contracts): add setPrimary and findPrimaryByTransactionId to TransactionTagsRepository"
```

---

## Task 4: Generate migration and append backfill SQL

**Files:**
- Create: `packages/app/drizzle/<generated>_add_is_primary_to_transaction_tags.sql`

- [ ] **Step 1: Run the Drizzle generator**

```bash
cd packages/app && yarn db:generate
```

Expected: A new `.sql` file appears in `packages/app/drizzle/` with an auto-assigned four-digit prefix. It contains `ALTER TABLE transaction_tags ADD COLUMN is_primary INTEGER DEFAULT 0 NOT NULL;` and `CREATE UNIQUE INDEX transaction_tags_primary_idx ON transaction_tags(transaction_id) WHERE is_primary = 1;`. Note the filename — Drizzle also updates `drizzle/meta/_journal.json` and writes a new `_snapshot.json`.

- [ ] **Step 2: Append the backfill UPDATE**

Open the newly-generated file and append the following at the end:

```sql
--> statement-breakpoint
-- backfill: lowest tag_id per transaction becomes primary
UPDATE transaction_tags
SET is_primary = 1
WHERE (transaction_id, tag_id) IN (
    SELECT transaction_id, MIN(tag_id)
    FROM transaction_tags
    GROUP BY transaction_id
);
```

The `--> statement-breakpoint` marker is required by the Drizzle migrator to treat the `UPDATE` as a separate statement from the preceding `CREATE INDEX`.

- [ ] **Step 3: Commit**

```bash
git add packages/app/drizzle/
git commit -m "feat(app): migrate transaction_tags with isPrimary column and backfill"
```

---

## Task 5: Update `transactionMapTagIdsToCreateEntities` util

**Files:**
- Modify: `packages/app/src/transaction/utils/transaction-map-tag-ids-to-create-entities.util.ts`

- [ ] **Step 1: Replace the util**

```ts
import { isDefined, isEmptyArray } from '@rnw-community/shared';

import type { TransactionTagsCreateEntityInterface } from '@budgie/contracts';

export const transactionMapTagIdsToCreateEntities = (
    tagIds: number[],
    transactionId: number,
    existingPrimaryTagId: number | null = null
): TransactionTagsCreateEntityInterface[] => {
    if (isEmptyArray(tagIds)) {
        return [];
    }

    const existingPrimarySurvived = isDefined(existingPrimaryTagId) && tagIds.includes(existingPrimaryTagId);
    const primaryTagId = existingPrimarySurvived ? existingPrimaryTagId : tagIds[0];

    return tagIds.map(tagId => ({ transactionId, tagId, isPrimary: tagId === primaryTagId }));
};
```

Semantics:
- On create (no existing primary): the first `tagId` becomes primary.
- On update where the previous primary survives: it stays primary.
- On update where the previous primary is removed: the first `tagId` of the new list becomes primary.

- [ ] **Step 2: Type check**

```bash
cd packages/app && yarn ts
```

Expected: clean, or errors only at the two service call sites (next tasks).

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/utils/transaction-map-tag-ids-to-create-entities.util.ts
git commit -m "feat(app): teach tag-id mapper about existing primary preservation"
```

---

## Task 6: Update `transaction-batch-create.service.ts` caller

**Files:**
- Modify: `packages/app/src/transaction/service/transaction-batch-create.service.ts`

- [ ] **Step 1: Locate the `transactionMapTagIdsToCreateEntities` call and pass `null`**

Find the existing call (it currently reads `transactionMapTagIdsToCreateEntities(tagIds, transactionId)`) and update it to:

```ts
transactionMapTagIdsToCreateEntities(tagIds, transactionId, null)
```

Explicit `null` documents the "no prior primary" semantics for batch creates. The default parameter would work too, but explicit is clearer here.

- [ ] **Step 2: Type check**

```bash
cd packages/app && yarn ts
```

Expected: this file now clean; `transaction.service.ts` still reports an error (fixed in the next task) or compiles if no caller currently depends on explicit-arity.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/service/transaction-batch-create.service.ts
git commit -m "feat(app): pass null primary to batch create mapper"
```

---

## Task 7: Capture previous primary in `upsertEntriesAndTags`

**Files:**
- Modify: `packages/app/src/transaction/service/transaction.service.ts`

- [ ] **Step 1: Update `upsertEntriesAndTags`**

Replace the existing `upsertEntriesAndTags` private method (currently around lines 219–232) with:

```ts
private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateInputInterface, tx: DB): Promise<void> {
    await transactionEntryRepository.deleteByTransactionId(transactionId, tx);
    await transactionEntryRepository.bulkCreate(
        input.entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId)),
        tx
    );

    const existingPrimary = await transactionTagsRepository.findPrimaryByTransactionId(transactionId, tx);
    await transactionTagsRepository.deleteByTransactionId(transactionId, tx);
    if (isNotEmptyArray(input.tagIds)) {
        await transactionTagsRepository.bulkCreate(
            transactionMapTagIdsToCreateEntities(input.tagIds, transactionId, existingPrimary?.tagId ?? null),
            tx
        );
    }
}
```

- [ ] **Step 2: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/service/transaction.service.ts
git commit -m "feat(app): preserve primary tag across transaction edits"
```

---

## Task 8: Create `sortTransactionTagsByPrimary` util

**Files:**
- Create: `packages/app/src/transaction/utils/sort-transaction-tags-by-primary.util.ts`

- [ ] **Step 1: Write the util**

```ts
import type { TransactionTagsEntityInterface, TransactionTagsWithTagEntityInterface } from '@budgie/contracts';

export const sortTransactionTagsByPrimary = <T extends Pick<TransactionTagsEntityInterface, 'tagId' | 'isPrimary'>>(
    transactionTags: readonly T[]
): T[] =>
    [...transactionTags].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
            return a.isPrimary ? -1 : 1;
        }

        return a.tagId - b.tagId;
    });
```

Note: `TransactionTagsWithTagEntityInterface` is referenced for documentation that typical callers will pass the joined shape. The generic constraint is the minimal shape the helper needs. If the specific type name is not an existing export, remove that import — the function's generic constraint is what matters.

- [ ] **Step 2: Type check**

```bash
cd packages/app && yarn ts
```

Expected: clean. If `TransactionTagsWithTagEntityInterface` does not exist, delete that type from the imports block; the sort function does not need it.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/utils/sort-transaction-tags-by-primary.util.ts
git commit -m "feat(app): add sortTransactionTagsByPrimary util"
```

---

## Task 9: Create `TransactionCardTagChip` component

**Files:**
- Create: `packages/app/src/transaction/components/transaction-card-tag-chip/transaction-card-tag-chip.tsx`

- [ ] **Step 1: Write the chip component**

```tsx
import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly isPrimary?: boolean;
    readonly isDimmed?: boolean;
    readonly onPress?: () => void;
    readonly onLongPress?: () => void;
    readonly testID?: string;
}

const chipVariants = cva('flex-row items-center gap-x-xs rounded-full px-sm py-[2px] border', {
    variants: {
        isPrimary: {
            true: 'border-primary/40 bg-primary/10',
            false: 'border-secondary-corner'
        },
        isDimmed: {
            true: 'opacity-50',
            false: 'opacity-100'
        }
    },
    defaultVariants: { isPrimary: false, isDimmed: false }
});

const textVariants = cva('text-xs', {
    variants: {
        isPrimary: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    },
    defaultVariants: { isPrimary: false }
});

export const TransactionCardTagChip = ({ title, isPrimary = false, isDimmed = false, onPress, onLongPress, testID }: Props) => {
    const iconClassName = textVariants({ isPrimary });

    const body = (
        <View className={chipVariants({ isPrimary, isDimmed })}>
            <Icon icon={UserIconNameEnum.Tag} size={12} className={iconClassName} />
            <Text className={textVariants({ isPrimary })} numberOfLines={1} ellipsizeMode="tail">
                {title}
            </Text>
        </View>
    );

    if (onPress === undefined && onLongPress === undefined) {
        return body;
    }

    return (
        <HapticPressable onPress={onPress} onLongPress={onLongPress} testID={testID}>
            {body}
        </HapticPressable>
    );
};
```

Note: React 19 permits `ref`/callback props as plain props; CVA follows the existing filter-chip convention. This component is pure — no state, no hooks beyond the ones in `HapticPressable`.

- [ ] **Step 2: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/components/transaction-card-tag-chip/transaction-card-tag-chip.tsx
git commit -m "feat(app): add TransactionCardTagChip primitive"
```

---

## Task 10: Create `usePromotePrimaryTag` hook

**Files:**
- Create: `packages/app/src/transaction/hook/use-promote-primary-tag.hook.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useLingui } from '@lingui/react/macro';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import Toast from 'react-native-toast-message';

import { transactionAsync } from '@budgie/contracts';
import { getErrorMessage } from '@rnw-community/shared';

import { db, transactionTagsRepository } from '../../@generic/drizzle/db/db';

export const usePromotePrimaryTag = (transactionId: number) => {
    const { t } = useLingui();
    const inFlightRef = useRef(false);

    const promote = async (tagId: number): Promise<void> => {
        if (inFlightRef.current) {
            return;
        }

        inFlightRef.current = true;
        try {
            await Haptics.selectionAsync();
            await transactionAsync(db, async tx => {
                await transactionTagsRepository.setPrimary(transactionId, tagId, tx);
            });
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Toast.show({
                type: 'error',
                text1: t`Couldn't update primary tag`,
                text2: getErrorMessage(error)
            });
        } finally {
            inFlightRef.current = false;
        }
    };

    return { promote };
};
```

Note: The `useLiveQuery` subscription on the transaction list is the source of truth — once the DB commit lands, the card re-renders with the new primary automatically. No optimistic local state is needed in this hook; the animation is driven by the declarative order from `sortTransactionTagsByPrimary`, and Reanimated's `LinearTransition.springify()` layout animation handles the swap on re-render. On error the DB is untouched, so the list stays visually correct.

Imports of `db` and `transactionTagsRepository` come from the repository exports at `@generic/drizzle/db/db` — verify the export names match before running `yarn ts`. If the repository is exported under a different name at that module (e.g. `transactionTags` instead of `transactionTagsRepository`), use whatever the file exports.

- [ ] **Step 2: Verify repository export**

```bash
grep -n "transactionTagsRepository\|transactionTags" packages/app/src/@generic/drizzle/db/db.ts
```

Expected: the module exports a `transactionTagsRepository` (or similar) singleton. If the name differs, update the import in the hook.

- [ ] **Step 3: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/transaction/hook/use-promote-primary-tag.hook.ts
git commit -m "feat(app): add usePromotePrimaryTag hook"
```

---

## Task 11: Create `TransactionCardTagsInlinePicker` component

**Files:**
- Create: `packages/app/src/transaction/components/transaction-card-tags-inline-picker/transaction-card-tags-inline-picker.tsx`

- [ ] **Step 1: Write the expanded picker row**

```tsx
import { TagEntityInterface } from '@budgie/contracts';
import Animated, { FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';

interface Props {
    readonly tags: readonly (TagEntityInterface & { readonly isPrimary: boolean })[];
    readonly onSelect: (tagId: number) => void;
}

const CHIP_STAGGER_MS = 30;

export const TransactionCardTagsInlinePicker = ({ tags, onSelect }: Props) => (
    <Animated.View className="flex-row flex-wrap items-center gap-xs" layout={LinearTransition.springify()}>
        {tags.map((tag, index) => {
            const handlePress = () => void onSelect(tag.id);

            return (
                <Animated.View
                    key={tag.id}
                    entering={FadeInRight.springify().delay(index * CHIP_STAGGER_MS)}
                    exiting={FadeOutLeft.duration(120)}
                    layout={LinearTransition.springify()}
                >
                    <TransactionCardTagChip title={tag.title} isPrimary={tag.isPrimary} onPress={handlePress} />
                </Animated.View>
            );
        })}
    </Animated.View>
);
```

- [ ] **Step 2: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/components/transaction-card-tags-inline-picker/transaction-card-tags-inline-picker.tsx
git commit -m "feat(app): add TransactionCardTagsInlinePicker"
```

---

## Task 12: Create `TransactionCardTags` orchestrator

**Files:**
- Create: `packages/app/src/transaction/components/transaction-card-tags/transaction-card-tags.tsx`

- [ ] **Step 1: Write the orchestrator**

```tsx
import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { usePromotePrimaryTag } from '../../hook/use-promote-primary-tag.hook';
import { sortTransactionTagsByPrimary } from '../../utils/sort-transaction-tags-by-primary.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';
import { TransactionCardTagsInlinePicker } from '../transaction-card-tags-inline-picker/transaction-card-tags-inline-picker';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const COLLAPSE_DELAY_MS = 3000;

export const TransactionCardTags = ({ transaction }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { promote } = usePromotePrimaryTag(transaction.id);

    const sorted = sortTransactionTagsByPrimary(transaction.transactionTags);
    const primaryRow = sorted[0];
    const primaryTag = isDefined(primaryRow) ? primaryRow.tag : null;
    const hasMultipleTags = sorted.length > 1;
    const siblingsCount = sorted.length - 1;

    const handleLongPress = async () => {
        if (!hasMultipleTags) {
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsExpanded(true);
    };

    const handleSelect = async (tagId: number) => {
        setIsExpanded(false);
        if (isDefined(primaryRow) && tagId === primaryRow.tagId) {
            return;
        }

        await promote(tagId);
    };

    if (!isNotEmptyArray(sorted) || !isDefined(primaryTag)) {
        return null;
    }

    if (isExpanded) {
        const tagsWithMeta = sorted.map(row => ({ ...row.tag, isPrimary: row.isPrimary }));

        return (
            <View className="flex-row items-center" testID={TransactionCardSelector.Tag(primaryTag.title)}>
                <TransactionCardTagsInlinePicker tags={tagsWithMeta} onSelect={handleSelect} />
            </View>
        );
    }

    return (
        <Animated.View className="flex-row items-center gap-x-xs" layout={LinearTransition.springify()} testID={TransactionCardSelector.Tag(primaryTag.title)}>
            <TransactionCardTagChip title={primaryTag.title} isPrimary={hasMultipleTags} onLongPress={handleLongPress} />
            {hasMultipleTags ? (
                <View className="rounded-full border border-secondary-corner px-sm py-[2px]">
                    <Text className="text-xs text-secondary-foreground">{`+${siblingsCount}`}</Text>
                </View>
            ) : null}
        </Animated.View>
    );
};
```

Auto-collapse of the expanded picker after 3s of inactivity is desirable. Add this `useEffect` immediately after the `handleSelect` declaration inside the component body:

```tsx
useEffect(() => {
    if (!isExpanded) {
        return undefined;
    }

    const timeoutId = setTimeout(() => setIsExpanded(false), COLLAPSE_DELAY_MS);

    return () => clearTimeout(timeoutId);
}, [isExpanded]);
```

And add `useEffect` to the `react` import at the top of the file.

- [ ] **Step 2: Verify `TransactionCardSelector.Tag(...)` exists**

```bash
grep -n "Tag:" packages/app/src/transaction/components/transaction-card/transaction-card.selector.ts
```

Expected: the selector exposes `Tag: (title: string) => ...` already (used by the current single-tag component). Reuse it.

- [ ] **Step 3: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/transaction/components/transaction-card-tags/transaction-card-tags.tsx
git commit -m "feat(app): add TransactionCardTags orchestrator with inline long-press promote"
```

---

## Task 13: Swap `TransactionCardTag` → `TransactionCardTags` in `TransactionCardContent`

**Files:**
- Modify: `packages/app/src/transaction/components/transaction-card-content/transaction-card-content.tsx`
- Delete: `packages/app/src/transaction/components/transaction-card-tag/transaction-card-tag.tsx`

- [ ] **Step 1: Update the import**

In `transaction-card-content.tsx` find the line:

```tsx
import { TransactionCardTag } from '../transaction-card-tag/transaction-card-tag';
```

Replace with:

```tsx
import { TransactionCardTags } from '../transaction-card-tags/transaction-card-tags';
```

- [ ] **Step 2: Update the JSX usage**

Find:

```tsx
<TransactionCardTag transaction={transaction} />
```

Replace with:

```tsx
<TransactionCardTags transaction={transaction} />
```

- [ ] **Step 3: Delete the old component folder**

```bash
rm -rf packages/app/src/transaction/components/transaction-card-tag
```

- [ ] **Step 4: Type check + deadcode + lint**

```bash
cd packages/app && yarn ts && yarn lint && yarn deadcode
```

Expected: clean. `yarn deadcode` (knip) should not flag the deletion — knip only flags *unused* exports, not missing files.

- [ ] **Step 5: Commit**

```bash
git add packages/app/src/transaction/components/transaction-card-content/transaction-card-content.tsx
git add packages/app/src/transaction/components/transaction-card-tag
git commit -m "refactor(app): render TransactionCardTags in transaction card content"
```

---

## Task 14: Create `TagsSelectorDoneButton` component

**Files:**
- Create: `packages/app/src/tag/components/tags-selector-done-button/tags-selector-done-button.tsx`

- [ ] **Step 1: Write the floating pill**

```tsx
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly count: number;
    readonly onPress: EmptyFn;
    readonly testID?: string;
}

export const TagsSelectorDoneButton = ({ count, onPress, testID }: Props) => {
    const { t } = useLingui();
    const insets = useSafeAreaInsets();

    const containerStyle = { position: 'absolute' as const, bottom: insets.bottom + 12, left: 0, right: 0, alignItems: 'center' as const };

    return (
        <Animated.View entering={FadeInUp.springify()} exiting={FadeOutDown.duration(160)} style={containerStyle} pointerEvents="box-none">
            <HapticPressable
                onPress={onPress}
                testID={testID}
                className="rounded-full bg-primary px-2xl py-md flex-row items-center gap-x-sm"
                accessibilityRole="button"
                accessibilityLabel={t`Confirm tag selection`}
            >
                <Text className="text-primary-reverse text-sm font-semibold">{t`Done (${count})`}</Text>
            </HapticPressable>
        </Animated.View>
    );
};
```

- [ ] **Step 2: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/tag/components/tags-selector-done-button/tags-selector-done-button.tsx
git commit -m "feat(app): add floating Done pill for tag selector"
```

---

## Task 15: Refactor `tags-selector.tsx` for multi-select + dismiss-commits

**Files:**
- Modify: `packages/app/src/app/tags-selector.tsx`

- [ ] **Step 1: Replace with the new implementation**

```tsx
/* jscpd:ignore-start - Selector modal imports pattern */
import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
/* jscpd:ignore-end */
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { TagsSelectorDoneButton } from '../tag/components/tags-selector-done-button/tags-selector-done-button';
import { useTagFormModal } from '../tag/context/tag-form-modal.context';
import { useTagsSelectorModal } from '../tag/context/tags-selector-modal.context';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';

import { TagsSelectorModalSelector } from './tags-selector-modal.selector';

const NUM_COLUMNS = 3;

const prepareTagData = (tags: TagEntityInterface[] | null, excludeTagIds: number[], selectedTagIds: number[]) => {
    const filtered = isNotEmptyArray(tags) ? tags.filter(tag => !excludeTagIds.includes(tag.id)) : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedTagIds), NUM_COLUMNS);
};

export default function TagsSelectorModal() {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const [, resolveTagsSelector, currentParams] = useTagsSelectorModal();
    const { backgroundColor } = useFormsheetListStyles();

    const { initialTagIds = [], excludeTagIds = [], description, singleSelect = false } = currentParams ?? {};

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number[]>(initialTagIds);
    const { tags } = useSearchTagsQuery(search);

    const selectedRef = useRef(selected);
    selectedRef.current = selected;
    const hasResolvedRef = useRef(false);

    const data = prepareTagData(tags, excludeTagIds, selected);
    const containerStyle = { flex: 1, backgroundColor };

    const handleSelectTag = (tagId: number) => {
        if (singleSelect) {
            hasResolvedRef.current = true;
            resolveTagsSelector([tagId]);

            return;
        }

        setSelected(previous => (previous.includes(tagId) ? previous.filter(id => id !== tagId) : [...previous, tagId]));
    };

    const handleCreatePress = async () => {
        const result = await openTagForm({ defaultTitle: search });
        if (isDefined(result)) {
            setSelected(previous => [...previous, result.tag.id]);
        }
    };

    const handleDone = () => {
        hasResolvedRef.current = true;
        resolveTagsSelector(selectedRef.current);
    };

    useEffect(() => {
        return () => {
            if (!hasResolvedRef.current) {
                resolveTagsSelector(selectedRef.current, { skipBack: true });
            }
        };
    }, [resolveTagsSelector]);

    const isDirty =
        selected.length !== initialTagIds.length || selected.some((id, index) => id !== initialTagIds[index]);

    /* jscpd:ignore-start - FormSheet selector modal pattern */
    return (
        <View style={containerStyle} collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search tags...`}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={handleCreatePress}
                rightActionTestID={TagsSelectorModalSelector.CreateButton}
                testID={TagsSelectorModalSelector.Input}
            />

            {isNotEmptyString(description) ? (
                <View className="px-xl pb-md">
                    <Text className="text-foreground text-sm">{description}</Text>
                </View>
            ) : null}

            <TagsSelectContent data={data} selectedTagIds={selected} onSelect={handleSelectTag} />

            {isDirty && !singleSelect ? (
                <TagsSelectorDoneButton count={selected.length} onPress={handleDone} testID={TagsSelectorModalSelector.DoneButton} />
            ) : null}
        </View>
    );
    /* jscpd:ignore-end */
}
```

- [ ] **Step 2: Add `DoneButton` to the selector enum**

Open `packages/app/src/app/tags-selector-modal.selector.ts` and add a `DoneButton` entry alongside the existing ones:

```ts
export const TagsSelectorModalSelector = {
    Input: 'tags-selector-modal-input',
    CreateButton: 'tags-selector-modal-create-button',
    DoneButton: 'tags-selector-modal-done-button'
} as const;
```

Preserve the file's existing pattern (it may be an enum rather than an object). If it's an enum, add `DoneButton = 'tags-selector-modal-done-button'` as the new member.

- [ ] **Step 3: Verify the resolver hook signature supports `skipBack`**

```bash
grep -n "skipBack" packages/app/src/@generic/hook/use-modal-resolver/use-modal-resolver.hook.ts
```

Expected: `skipBack?: boolean` or equivalent appears in the `ResolveOptions` interface. If it doesn't exist, add it to the hook — but the exploration confirmed it's already present.

- [ ] **Step 4: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add packages/app/src/app/tags-selector.tsx packages/app/src/app/tags-selector-modal.selector.ts
git commit -m "feat(app): keep tag selector open across selections with Done commit"
```

---

## Task 16: Drop `focusKey` from `useGetTransactionsQuery`

**Files:**
- Modify: `packages/app/src/transaction/query/use-get-transactions.query.ts`

- [ ] **Step 1: Replace the file**

```ts
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { TransactionsByMonthSection } from '../interface/transactions-by-month-section.type';
import { groupTransactionsByMonth } from '../utils/group-transactions-by-month.util';

import type { TransactionFilterInterface } from '@budgie/contracts';

const DEFAULT_LIMIT = 20;

export const useGetTransactionsQuery = (filters?: TransactionFilterInterface) => {
    const { formatMonthAndYear } = useFormatDate();
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);

    useEffect(() => {
        setLoadedCount(DEFAULT_LIMIT);
    }, [filters]);

    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getAll(loadedCount + 1, filters), [loadedCount, filters]);

    const hasMore = data.length > loadedCount;
    const transactions = hasMore ? data.slice(0, -1) : data;

    const sections: TransactionsByMonthSection[] = groupTransactionsByMonth(transactions, formatMonthAndYear);

    const loadMore = () => {
        if (hasMore) {
            setLoadedCount(previous => previous + DEFAULT_LIMIT);
        }
    };

    return isDefined(updatedAt)
        ? { sections, loadMore, isLoading: false as const, error }
        : { sections, loadMore, isLoading: true as const, error };
};
```

Note: preserve the original file's return shape beyond the truncated excerpt. If the original file had additional lines past line 40 (e.g. extra return fields), keep them — the only conceptual change is removing `refreshKey` from the signature, from the `useEffect` dependency, and from the `useLiveQuery` dependency list, and switching the `useEffect` to depend on `filters`.

- [ ] **Step 2: Type check**

```bash
cd packages/app && yarn ts
```

Expected: caller at `transaction-list.tsx` fails to compile because it still passes a second argument. That's fixed in the next task.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/query/use-get-transactions.query.ts
git commit -m "refactor(app): reset transaction pagination on filter change instead of focus"
```

---

## Task 17: Drop `focusKey` from `TransactionList`

**Files:**
- Modify: `packages/app/src/transaction/components/transaction-list/transaction-list.tsx`

- [ ] **Step 1: Remove the prop and its usages**

Find the `Props` interface and remove the `focusKey` line. Remove `focusKey` from the destructure. Drop the second argument to `useGetTransactionsQuery` and the `focusKey` prop on `TransactionSectionsList`.

After edits the component signature should read:

```tsx
interface Props {
    readonly accountId?: number | null;
    readonly filters?: TransactionFilterInterface;
    readonly showFilters?: boolean;
    readonly footerSpacerMultiplier?: number;
}

export const TransactionList = ({ accountId = null, filters: externalFilters, showFilters = true, footerSpacerMultiplier }: Props) => {
    const { t } = useLingui();

    const [internalFilters, setInternalFilters] = useState<TransactionFilterInterface>(DEFAULT_TRANSACTION_FILTER);

    const baseAccountIds = isDefined(accountId) ? [accountId] : null;
    const activeFilters = externalFilters ?? { ...internalFilters, accountIds: baseAccountIds ?? internalFilters.accountIds };
    const hasFiltersSelected = checkIfFiltersSelected(accountId, activeFilters);
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(activeFilters);

    // ... rest unchanged, but replace the `<TransactionSectionsList ... focusKey={focusKey} />` prop with the same element without that prop.
```

And at the bottom:

```tsx
            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={listEmptyState}
                balanceAdjustmentLabel={balanceAdjustmentLabel}
                categoriesLabel={categoriesLabel}
                footerSpacerMultiplier={footerSpacerMultiplier}
            />
```

- [ ] **Step 2: Type check**

```bash
cd packages/app && yarn ts
```

Expected: `transaction-sections-list.tsx` now complains that `focusKey` is declared but unused, or that a required prop is missing. That's fixed in the next task.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/components/transaction-list/transaction-list.tsx
git commit -m "refactor(app): drop focusKey prop from TransactionList"
```

---

## Task 18: Drop `focusKey` from `TransactionSectionsList`

**Files:**
- Modify: `packages/app/src/transaction/components/transaction-sections-list/transaction-sections-list.tsx`

- [ ] **Step 1: Remove the prop and the LegendList key**

In the `Props` interface remove any `focusKey` entry. Remove `focusKey` from the destructure. On the `LegendList` element (the one currently rendered around lines 104–114), delete the `key={focusKey}` attribute.

The render should start like:

```tsx
    return (
        <>
            <LegendList
                data={flatData}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                estimatedItemSize={80}
                stickyIndices={getStickyIndices(flatData)}
```

- [ ] **Step 2: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/components/transaction-sections-list/transaction-sections-list.tsx
git commit -m "fix(app): preserve transactions-list scroll across navigation"
```

---

## Task 19: Drop `useFocusKey` from `transactions.tsx`

**Files:**
- Modify: `packages/app/src/app/(tabs)/transactions.tsx`

- [ ] **Step 1: Remove the hook call + prop**

Delete the import `import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';`. Delete the line `const focusKey = useFocusKey();`. In the JSX, change `<TransactionList focusKey={focusKey} accountId={null} />` to `<TransactionList accountId={null} />`.

Final file should match the original exactly, minus those three references.

- [ ] **Step 2: Verify `useFocusKey` still has at least one remaining consumer**

```bash
grep -rn "useFocusKey" packages/app/src
```

Expected: matches only in `packages/app/src/@generic/hook/use-focus-key.hook.ts` (the definition) and `packages/app/src/transaction/hook/use-recurring-calendar.hook.ts` (the legitimate remaining consumer). If no other file still consumes it, the hook file stays — the recurring calendar still needs it.

- [ ] **Step 3: Type check + lint + deadcode**

```bash
cd packages/app && yarn ts && yarn lint && yarn deadcode
```

Expected: clean. `yarn deadcode` must not flag `useFocusKey` as unused (the recurring calendar hook imports it).

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/app/(tabs)/transactions.tsx
git commit -m "fix(app): stop forcing transactions-list remount on focus"
```

---

## Task 20: Create `useUncategorizedCountQuery`

**Files:**
- Create: `packages/app/src/transaction/query/use-uncategorized-count.query.ts`

- [ ] **Step 1: Write the live query**

```ts
import { TransactionEntityTable } from '@budgie/contracts';
import { and, isNull, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../../@generic/drizzle/db/db';

export const useUncategorizedCountQuery = () => {
    const { data } = useLiveQuery(
        db
            .select({ count: sql<number>`COUNT(*)` })
            .from(TransactionEntityTable)
            .where(and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.categoryId)))
    );

    return { count: data[0]?.count ?? 0 };
};
```

Note: `TransactionEntityTable` is exported from `@budgie/contracts`. `deletedAt` is the standard soft-delete column (per contracts CLAUDE.md). If the table file exposes `categoryId` under a different name or via a relation, use whichever matches the actual `TransactionEntityTable.$inferSelect` shape.

- [ ] **Step 2: Verify `TransactionEntityTable.categoryId` exists**

```bash
grep -n "categoryId\|category_id" packages/contracts/src/transaction/table/transaction-entity.table.ts
```

Expected: a `categoryId` column. If the column is actually stored elsewhere (e.g. on `transaction_entries`), adapt the query accordingly before running.

- [ ] **Step 3: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/transaction/query/use-uncategorized-count.query.ts
git commit -m "feat(app): add useUncategorizedCountQuery live query"
```

---

## Task 21: Create the `TransactionUncategorizedFilter` component

**Files:**
- Create: `packages/app/src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.tsx`
- Create: `packages/app/src/transaction/components/transaction-uncategorized-filter/transaction-uncategorized-filter.selector.ts`

- [ ] **Step 1: Write the test-id enum**

```ts
export const TransactionUncategorizedFilterSelector = {
    Chip: 'transaction-uncategorized-filter-chip'
} as const;
```

Preserve whichever pattern other filter files use (enum vs `as const` object). Match the existing `transaction-filter-chip.selector.ts` if one exists; otherwise `as const` is fine.

- [ ] **Step 2: Write the chip component**

```tsx
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { isEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useUncategorizedCountQuery } from '../../query/use-uncategorized-count.query';

import { TransactionUncategorizedFilterSelector } from './transaction-uncategorized-filter.selector';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

const chipVariants = cva('rounded-2xl border px-xl py-sm flex-row items-center gap-x-sm', {
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

export const TransactionUncategorizedFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const { count } = useUncategorizedCountQuery();
    const isActive = isEmptyArray(value);

    if (count === 0 && !isActive) {
        return null;
    }

    const handlePress = () => void onChange(isActive ? null : []);

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

- [ ] **Step 3: Verify warning palette class names exist**

```bash
grep -n "warning-corner\|warning-background\|warning-foreground" packages/app/tailwind.config.js packages/app/src/@generic/constant 2>/dev/null | head
```

Expected: these tokens exist (the app CLAUDE.md lists `warning` and `dark-warning` variants as available). If they don't exist under those exact names, substitute with the actual tokens used by other warning-state components (e.g. `destructive-*`). Keep the visual intent: amber/warning palette when inactive.

- [ ] **Step 4: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add packages/app/src/transaction/components/transaction-uncategorized-filter
git commit -m "feat(app): add TransactionUncategorizedFilter chip"
```

---

## Task 22: Integrate the Uncategorized chip into the filter row

**Files:**
- Modify: `packages/app/src/transaction/components/transaction-filters/transaction-filters.tsx`

- [ ] **Step 1: Render the new chip as the first child of the ScrollView**

Add the import near the top:

```tsx
import { TransactionUncategorizedFilter } from '../transaction-uncategorized-filter/transaction-uncategorized-filter';
```

Inside the `ScrollView`, before the existing `DateFilter`, add:

```tsx
<TransactionUncategorizedFilter value={filters.categoryIds} onChange={createFilterHandler('categoryIds')} />
```

The Clear-All button remains at the very front (that element renders *before* the ScrollView-mapped filters based on the current code); the new Uncategorized chip becomes the first *filter* chip after Clear-All.

Final ScrollView contents:

```tsx
<ScrollView horizontal contentContainerClassName="flex-row items-center gap-x-md px-7xl" showsHorizontalScrollIndicator={false}>
    {hasFiltersSelected ? (
        <HapticPressable
            onPress={handleClear}
            className="bg-destructive-background border border-destructive-corner rounded-2xl px-xl py-sm flex-row items-center gap-x-xs"
            testID={TransactionFiltersSelector.ClearAllButton}
        >
            <Icon icon={UserIconNameEnum.X} className="text-destructive-foreground" size={14} />
            <Text className="text-destructive-foreground text-sm">
                <Trans>Clear All</Trans>
            </Text>
        </HapticPressable>
    ) : null}

    <TransactionUncategorizedFilter value={filters.categoryIds} onChange={createFilterHandler('categoryIds')} />

    <DateFilter value={filters.date} onChange={createFilterHandler('date')} />
    {showTypeFilter ? <TransactionTypeFilter value={filters.types} onChange={createFilterHandler('types')} /> : null}
    <TransactionCategoryFilter value={filters.categoryIds} onChange={createFilterHandler('categoryIds')} />
    <TransactionTagFilter value={filters.tagIds} onChange={createFilterHandler('tagIds')} />

    {isDefined(accountId) ? null : (
        <TransactionAccountFilter value={filters.accountIds} onChange={createFilterHandler('accountIds')} />
    )}
</ScrollView>
```

- [ ] **Step 2: Type check + lint**

```bash
cd packages/app && yarn ts && yarn lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/transaction/components/transaction-filters/transaction-filters.tsx
git commit -m "feat(app): show uncategorized filter as first chip"
```

---

## Task 23: Sync i18n strings

**Files:**
- Modify: `packages/app/locales/en/messages.po` + `.ts`
- Modify: `packages/app/locales/uk/messages.po` + `.ts`
- Modify: `packages/app/locales/de/messages.po` + `.ts`
- Modify: `packages/app/locales/es/messages.po` + `.ts`
- Modify: `packages/app/locales/fr/messages.po` + `.ts`

- [ ] **Step 1: Extract + compile**

```bash
cd packages/app && yarn i18n:sync
```

This creates empty `msgstr` entries for the following new keys across all locales:
- `Uncategorized ({count})`
- `Done ({count})`
- `Confirm tag selection`
- `Couldn't update primary tag`

- [ ] **Step 2: Fill in translations for `uk`, `de`, `es`, `fr`**

Open each `packages/app/locales/<locale>/messages.po` and fill in the translations. Suggested (copy these exactly unless the user overrides):

**uk:**
- `Uncategorized ({count})` → `Без категорії ({count})`
- `Done ({count})` → `Готово ({count})`
- `Confirm tag selection` → `Підтвердити вибір тегів`
- `Couldn't update primary tag` → `Не вдалося оновити основний тег`

**de:**
- `Uncategorized ({count})` → `Nicht kategorisiert ({count})`
- `Done ({count})` → `Fertig ({count})`
- `Confirm tag selection` → `Tag-Auswahl bestätigen`
- `Couldn't update primary tag` → `Primärer Tag konnte nicht aktualisiert werden`

**es:**
- `Uncategorized ({count})` → `Sin categoría ({count})`
- `Done ({count})` → `Listo ({count})`
- `Confirm tag selection` → `Confirmar selección de etiquetas`
- `Couldn't update primary tag` → `No se pudo actualizar la etiqueta principal`

**fr:**
- `Uncategorized ({count})` → `Non catégorisé ({count})`
- `Done ({count})` → `Terminé ({count})`
- `Confirm tag selection` → `Confirmer la sélection des tags`
- `Couldn't update primary tag` → `Impossible de mettre à jour le tag principal`

- [ ] **Step 3: Recompile the `.ts` messages**

```bash
cd packages/app && yarn i18n:sync
```

Expected: `.ts` files updated, no "missing translations" warnings for the keys above.

- [ ] **Step 4: Commit both `.po` and `.ts` updates**

```bash
git add packages/app/locales
git commit -m "chore(app): sync i18n for transaction UX strings"
```

---

## Task 24: Full validation pass + manual Maestro checks

**Files:**
- None (verification only).

- [ ] **Step 1: Run the full validation suite from repo root**

```bash
cd /Users/vitalyiegorov/budgie && yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
```

Expected: every command passes. If `yarn deadcode` flags a freshly-added export as unused, trace the consumer; if it's legitimately unused (e.g. a test-id enum referenced only by a Maestro flow not yet added), add the file to the knip ignore list only as a last resort and mention this in the final commit.

- [ ] **Step 2: Rebuild the app**

```bash
cd packages/app && yarn ios
```

Launch on simulator. Confirm the app boots without a migration crash. A fresh DB (simulator reset) executes the new migration and backfill on first launch; an existing DB applies only the new migration.

- [ ] **Step 3: Maestro — A.2 (tag selector stays open)**

- Create a new expense transaction.
- Tap the tag icon to open the selector.
- Tap three different tags. Confirm the sheet does NOT dismiss.
- Confirm the floating "Done (3)" pill appears once the selection is dirty.
- Tap Done. Confirm the sheet closes and all three tags appear on the transaction form.

- [ ] **Step 4: Maestro — A.3 (primary tag promote)**

- Create a transaction with 3 tags. Observe the card: primary chip + `+2`.
- Long-press the primary chip. Confirm the inline morph: all three chips appear in the row.
- Tap a non-primary chip. Confirm `Haptics.Selection`, the chip slides to primary position, the card collapses back to `primary + +2` showing the newly-chosen tag.
- Edit the transaction, remove the primary tag, save. Confirm the card now shows the next-lowest `tagId` as primary (invariant preserved across removals).

- [ ] **Step 5: Maestro — B.4 (scroll preserved)**

- Ensure at least 50 transactions exist (seed if needed).
- Scroll the transaction list to around row 50.
- Tap a transaction, edit amount, save.
- Confirm the list returns to the same scroll position and still renders ≥50 rows (no pagination reset on focus).
- Apply a category filter. Confirm the list resets to the top and shows filtered results.

- [ ] **Step 6: Maestro — B.5 (uncategorized chip)**

- Create a transaction with no category.
- Confirm an amber "Uncategorized (1)" chip appears as the first filter chip.
- Tap it. Confirm the list filters down to uncategorized transactions and the chip switches to primary palette.
- Tap again. Confirm the filter clears.
- Categorise the transaction. Confirm the chip disappears when count returns to 0.

- [ ] **Step 7: Maestro — B.4 regression (recurring calendar)**

- Open the recurring calendar tab.
- Navigate away, navigate back. Confirm the calendar still refreshes on focus (the `useFocusKey` usage there is intact).

- [ ] **Step 8: Final summary commit (if any docs touch-ups)**

Nothing to commit here unless prior tasks need a small fix-up. If the validation pass is clean, mark the PR ready.

---

## Post-plan: Open the PR

Title: `feat(app): transaction UX improvements — primary tag, scroll, uncategorized filter`

Body sections:
- Summary of the four fixes.
- Migration note (new column + backfill) with a reminder that existing installs migrate automatically on next launch.
- Maestro checklist from Task 24 as the test plan.
- Link to the design spec at `docs/superpowers/specs/2026-04-24-transaction-ux-improvements-design.md`.
