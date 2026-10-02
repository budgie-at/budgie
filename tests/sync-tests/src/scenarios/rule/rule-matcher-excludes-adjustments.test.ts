import { RuleMatcherService } from '@app/rule/service/rule-matcher.service';
import {
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { seed } from '../../harness/seed/seed';

const MATCHING_TITLE = 'Balance correction fee';

const insertTransaction = (type: TransactionTypeEnum, accountId: number) => {
    const transaction = insertOne(TransactionEntityTable, {
        type,
        title: MATCHING_TITLE,
        externalId: null,
        externalSource: null,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        exchangeRate: 1,
        fromAccountId: accountId,
        toAccountId: null,
        comment: '',
        updatedBy: null
    });

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        categoryId: null,
        mccCategoryId: null,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: 1_000_000,
        externalId: null,
        exchangeRate: 1,
        toIban: null,
        originalTransactionId: null
    });

    return transaction;
};

describe('rule/rule-matcher excludes adjustments', () => {
    it.effect('excludes ADJUSTMENT transactions from SQL rule matching while matching the same title on an EXPENSE', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const account = seed.account({ title: 'Rule matcher account' });
            insertTransaction(TransactionTypeEnum.EXPENSE, account.id);
            insertTransaction(TransactionTypeEnum.ADJUSTMENT, account.id);

            const params = {
                conditions: [
                    {
                        field: RuleConditionFieldEnum.TITLE,
                        operator: RuleConditionOperatorEnum.CONTAINS,
                        value: 'correction',
                        secondaryValue: null
                    }
                ],
                conditionMatchType: RuleConditionMatchTypeEnum.ALL
            };

            const count = yield* ruleMatcherService.countMatchingTransactions(params);

            expect(count).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
