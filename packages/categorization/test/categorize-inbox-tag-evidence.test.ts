import { CategorizeInboxLabelKindEnum, CategorizeInboxService, TransactionCategorizeInboxRepository } from '@budgie/categorization';
import { TagSourceEnum, TransactionTagsRepository, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer, testSeedService } from './harness/test-context';

const operatedAt = new Date('2026-02-03T09:00:00Z');

const seedTitledExpense = Effect.fn('seedTitledExpense')(function* (accountId: number, title: string) {
    const expense = yield* testSeedService.bankPairExpense({ externalId: title, operatedAt }, { accountId, amount: 1_000 });

    yield* testSeedService.updateTransaction(expense.id, { title });

    return expense;
});

describe('categorization/inbox-tag-evidence', () => {
    it.effect('counts only user-picked tags as tag evidence', () =>
        Effect.gen(function* () {
            const inboxService = yield* CategorizeInboxService;
            const inboxRepository = yield* TransactionCategorizeInboxRepository;
            const transactionTagsRepository = yield* TransactionTagsRepository;
            const account = yield* testSeedService.account();
            const tag = yield* testSeedService.tag('Evidence Flat');
            const userExpense = yield* seedTitledExpense(account.id, 'Evidence User Shop');
            const inboxExpense = yield* seedTitledExpense(account.id, 'Evidence Inbox Shop');
            const ruleExpense = yield* seedTitledExpense(account.id, 'Evidence Rule Shop');

            yield* testSeedService.transactionTag(userExpense.id, tag.id);
            yield* inboxService.assign(CategorizeInboxLabelKindEnum.TAG, [
                {
                    key: 'Evidence Inbox Shop',
                    displayTitle: 'Evidence Inbox Shop',
                    labelId: tag.id,
                    ruleConditionValue: '',
                    rows: [
                        {
                            transactionId: inboxExpense.id,
                            type: TransactionTypeEnum.EXPENSE,
                            title: 'Evidence Inbox Shop',
                            operatedAt,
                            amount: 1_000,
                            baseAmount: null,
                            baseInstrumentId: null,
                            instrumentSymbol: 'EUR',
                            mccCategoryId: null,
                            mcc: null
                        }
                    ]
                }
            ]);
            yield* transactionTagsRepository.addTagByTransactionIds([ruleExpense.id], tag.id, TagSourceEnum.RULE);

            const storedSources = yield* transactionTagsRepository.findByTransactionIds([userExpense.id, inboxExpense.id, ruleExpense.id]);
            const evidence = yield* inboxRepository.findTagEvidence();

            expect(storedSources.map(row => [row.transactionId, row.source])).toEqual(
                expect.arrayContaining([
                    [userExpense.id, TagSourceEnum.USER],
                    [inboxExpense.id, TagSourceEnum.INBOX],
                    [ruleExpense.id, TagSourceEnum.RULE]
                ])
            );
            expect(evidence.filter(row => row.labelId === tag.id).map(row => row.title)).toEqual(['Evidence User Shop']);
        }).pipe(Effect.provide(TestLayer))
    );
});
