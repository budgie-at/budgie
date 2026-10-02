import {
    CategoryEntityTable,
    RuleActionEntityTable,
    RuleActionTypeEnum,
    RuleConditionEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { RuleEngineService, TransactionRuleRepository } from '@budgie/rules';
import { describe, expect, it } from '@effect/vitest';
import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';

const RULE_TITLE = 'Rule fee target';

const seedTitledExpense = (accountId: number, externalId: string) =>
    Effect.gen(function* () {
        const expense = yield* seed.bankPairExpense(
            { externalId, operatedAt: new Date('2026-06-02T12:00:00.000Z') },
            { accountId, amount: 10_000_000 }
        );

        return yield* seed.updateTransaction(expense.id, { title: RULE_TITLE });
    });

const seedCategoryRule = (categoryId: number) =>
    Effect.gen(function* () {
        const [rule] = yield* testDb
            .insert(RuleEntityTable)
            .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
            .returning();

        yield* testDb.insert(RuleConditionEntityTable).values({
            ruleId: rule.id,
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: RULE_TITLE,
            secondaryValue: null
        });
        yield* testDb
            .insert(RuleActionEntityTable)
            .values({ ruleId: rule.id, type: RuleActionTypeEnum.SET_CATEGORY, categoryId, tagId: null, accountId: null });

        return rule;
    });

describe('rule/rule-category-skips-fee-and-consolidation-child', () => {
    it.effect('categorizes only the primary leg of a visible transaction and leaves fee legs and consolidation children untouched', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const transactionRuleRepository = yield* TransactionRuleRepository;
            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const account = yield* seed.account({ title: 'Rule fee account' });
            const expense = yield* seedTitledExpense(account.id, 'rule-fee-expense');
            const parent = yield* seedTitledExpense(account.id, 'rule-fee-parent');
            const child = yield* seedTitledExpense(account.id, 'rule-fee-child');
            yield* seed.feeEntry(expense.id, 'rule-fee-leg', { accountId: account.id, amount: 500_000 });
            yield* testDb
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: parent.id })
                .where(eq(TransactionEntityTable.id, child.id));
            const rule = yield* seedCategoryRule(category.id);

            const result = yield* ruleEngineService.applyRuleToMatchingTransactions(rule.id, null);
            const directlyCategorizedIds = yield* transactionRuleRepository.setCategoryByTransactionIds([child.id], category.id);
            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(inArray(TransactionEntryEntityTable.transactionId, [expense.id, child.id]));
            const categoryByLeg = entries.map(entry => [entry.transactionId, entry.type, entry.categoryId]);

            expect(result.total).toBe(2);
            expect(directlyCategorizedIds).toEqual([]);
            expect(categoryByLeg).toEqual(
                expect.arrayContaining([
                    [expense.id, TransactionEntryTypeEnum.CREDIT, category.id],
                    [expense.id, TransactionEntryTypeEnum.FEE, null],
                    [child.id, TransactionEntryTypeEnum.CREDIT, null]
                ])
            );
            expect(categoryByLeg).toHaveLength(3);
        }).pipe(Effect.provide(TestLayer))
    );
});
