import {
    PRECISION,
    RuleActionTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { RuleEngineService } from '@budgie/rules';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchTransactionById, runRefundScenario, seed, testDb, TestLayer } from '../../harness';
import { seedTitleRule } from '../../harness/seed/seed-title-rule';

describe('rule/rule-transfer-conversion-skips-consolidated-canonical', () => {
    it.effect('does not convert a refund canonical to a transfer and keeps its moved refund entries', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { expense, refunds } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [40 * PRECISION],
                externalIdPrefix: 'rule-convert-refund'
            });
            const targetAccount = yield* seed.account({ title: 'Rule target', externalId: 'rule-target' });
            const rule = yield* seedTitleRule(expense.title, {
                type: RuleActionTypeEnum.CONVERT_TO_TRANSFER,
                categoryId: null,
                accountId: targetAccount.id
            });

            expect((yield* fetchTransactionById(expense.id)).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

            yield* ruleEngineService.applyRuleToMatchingTransactions(rule.id);

            const canonical = yield* fetchTransactionById(expense.id);
            const movedEntries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.originalTransactionId, refunds[0].id));

            expect(canonical.type).toBe(TransactionTypeEnum.EXPENSE);
            expect(canonical.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
            expect(movedEntries.map(entry => entry.transactionId)).toEqual([expense.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});
