import { CategorizeInboxLabelKindEnum, CategorizeInboxService, TransactionCategorizeInboxRepository } from '@budgie/categorization';
import {
    CategorySourceEnum,
    TagSourceEnum,
    TransactionEntryEntityTable,
    TransactionTagsRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { TestLayer, testDb, testSeedService } from './harness/test-context';

import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';

const operatedAt = new Date('2026-02-03T09:00:00Z');

const seedTitledExpense = Effect.fn('seedTitledExpense')(function* (accountId: number, title: string) {
    const expense = yield* testSeedService.bankPairExpense({ externalId: title, operatedAt }, { accountId, amount: 1_000 });

    yield* testSeedService.updateTransaction(expense.id, { title });

    return expense;
});

const buildAssignment = (transactionId: number, title: string, labelId: number): CategorizeInboxAssignmentInterface => ({
    key: title,
    displayTitle: title,
    labelId,
    ruleConditionValue: '',
    rows: [
        {
            transactionId,
            type: TransactionTypeEnum.EXPENSE,
            title,
            operatedAt,
            amount: 1_000,
            baseAmount: null,
            baseInstrumentId: null,
            instrumentSymbol: 'EUR',
            mccCategoryId: null,
            mcc: null
        }
    ]
});

describe('categorization/inbox-evidence', () => {
    it.effect('counts only user-picked tags, including inbox follow-up picks, as tag evidence', () =>
        Effect.gen(function* () {
            const inboxService = yield* CategorizeInboxService;
            const inboxRepository = yield* TransactionCategorizeInboxRepository;
            const transactionTagsRepository = yield* TransactionTagsRepository;
            const account = yield* testSeedService.account();
            const tag = yield* testSeedService.tag('Evidence Flat');
            const userExpense = yield* seedTitledExpense(account.id, 'Evidence User Shop');
            const inboxExpense = yield* seedTitledExpense(account.id, 'Evidence Inbox Shop');
            const followUpExpense = yield* seedTitledExpense(account.id, 'Evidence Follow Up Shop');
            const ruleExpense = yield* seedTitledExpense(account.id, 'Evidence Rule Shop');

            yield* testSeedService.transactionTag(userExpense.id, tag.id);
            yield* inboxService.assign(CategorizeInboxLabelKindEnum.TAG, [buildAssignment(inboxExpense.id, 'Evidence Inbox Shop', tag.id)]);
            yield* inboxService.assign(
                CategorizeInboxLabelKindEnum.TAG,
                [buildAssignment(followUpExpense.id, 'Evidence Follow Up Shop', tag.id)],
                TagSourceEnum.USER
            );
            yield* transactionTagsRepository.addTagByTransactionIds([ruleExpense.id], tag.id, TagSourceEnum.RULE);

            const storedSources = yield* transactionTagsRepository.findByTransactionIds([
                userExpense.id,
                inboxExpense.id,
                followUpExpense.id,
                ruleExpense.id
            ]);
            const evidence = yield* inboxRepository.findTagEvidence();

            expect(storedSources.map(row => [row.transactionId, row.source])).toEqual(
                expect.arrayContaining([
                    [userExpense.id, TagSourceEnum.USER],
                    [inboxExpense.id, TagSourceEnum.INBOX],
                    [followUpExpense.id, TagSourceEnum.USER],
                    [ruleExpense.id, TagSourceEnum.RULE]
                ])
            );
            expect(
                evidence
                    .filter(row => row.labelId === tag.id)
                    .map(row => row.title)
                    .sort()
            ).toEqual(['Evidence Follow Up Shop', 'Evidence User Shop']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stores inbox category accepts as INBOX and leaves them out of category evidence', () =>
        Effect.gen(function* () {
            const inboxService = yield* CategorizeInboxService;
            const inboxRepository = yield* TransactionCategorizeInboxRepository;
            const account = yield* testSeedService.account();
            const category = yield* testSeedService.category('Evidence Groceries');
            const userExpense = yield* seedTitledExpense(account.id, 'Evidence User Market');
            const inboxExpense = yield* seedTitledExpense(account.id, 'Evidence Inbox Market');

            yield* inboxRepository.updateUncategorizedCategoryByTransactionIds([userExpense.id], category.id, CategorySourceEnum.USER);
            yield* inboxService.assign(CategorizeInboxLabelKindEnum.CATEGORY, [
                buildAssignment(inboxExpense.id, 'Evidence Inbox Market', category.id)
            ]);

            const inboxEntries = yield* testDb
                .select({ categoryId: TransactionEntryEntityTable.categoryId, categorySource: TransactionEntryEntityTable.categorySource })
                .from(TransactionEntryEntityTable)
                .where(inArray(TransactionEntryEntityTable.transactionId, [inboxExpense.id]));
            const evidence = yield* inboxRepository.findCategoryEvidence();

            expect(inboxEntries).toContainEqual({ categoryId: category.id, categorySource: CategorySourceEnum.INBOX });
            expect(evidence.filter(row => row.labelId === category.id).map(row => row.title)).toEqual(['Evidence User Market']);
        }).pipe(Effect.provide(TestLayer))
    );
});
