import { TransactionCategorizeInboxRepository } from '@budgie/categorization';
import { CategorySourceEnum, DEFAULT_TRANSACTION_FILTER, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { TestLayer, testDb, testSeedService } from './harness/test-context';

const operatedAt = new Date('2026-02-03T09:00:00Z');

const evidenceSources = new Set([CategorySourceEnum.USER, CategorySourceEnum.RULE, CategorySourceEnum.MANUAL_EXPENSE_DUPLICATE]);
const uncategorizedSources = new Set([CategorySourceEnum.MCC_DEFAULT, CategorySourceEnum.INBOX]);

const expectedPolicy = Object.fromEntries(
    Object.values(CategorySourceEnum).map(source => [
        source,
        { isCategorized: !uncategorizedSources.has(source), isEvidence: evidenceSources.has(source) }
    ])
);

describe('categorization/inbox-category-source-policy', () => {
    it.effect('classifies every category source for inbox rows and category evidence', () =>
        Effect.gen(function* () {
            const inboxRepository = yield* TransactionCategorizeInboxRepository;
            const account = yield* testSeedService.account();
            const category = yield* testSeedService.category('Policy Category');

            for (const source of Object.values(CategorySourceEnum)) {
                const title = `Policy ${source}`;
                const expense = yield* testSeedService.bankPairExpense(
                    { externalId: title, operatedAt },
                    { accountId: account.id, amount: 1_000 }
                );

                yield* testSeedService.updateTransaction(expense.id, { title });

                const entries = yield* testDb
                    .select({ id: TransactionEntryEntityTable.id })
                    .from(TransactionEntryEntityTable)
                    .where(eq(TransactionEntryEntityTable.transactionId, expense.id));

                for (const entry of entries) {
                    yield* testSeedService.entryCategory(entry.id, category.id, source);
                }
            }

            const rows = yield* inboxRepository.findUntaggedRows(DEFAULT_TRANSACTION_FILTER);
            const evidence = yield* inboxRepository.findCategoryEvidence;
            const observedPolicy = Object.fromEntries(
                Object.values(CategorySourceEnum).map(source => [
                    source,
                    {
                        isCategorized: rows.find(row => row.title === `Policy ${source}`)?.categoryId === category.id,
                        isEvidence: evidence.some(item => item.title === `Policy ${source}` && item.labelId === category.id)
                    }
                ])
            );

            expect(observedPolicy).toEqual(expectedPolicy);
        }).pipe(Effect.provide(TestLayer))
    );
});
