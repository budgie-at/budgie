import { transactionRuleRepository } from '@app/@generic/drizzle/db/db';
import { ruleEngineService } from '@app/rule/service/rule-engine.service';
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
import { eq, inArray } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { seed, testDb } from '../../harness';

const RULE_TITLE = 'Rule fee target';

const seedTitledExpense = (accountId: number, externalId: string) => {
    const expense = seed.bankPairExpense(
        { externalId, operatedAt: new Date('2026-06-02T12:00:00.000Z') },
        { accountId, amount: 10_000_000 }
    );

    return seed.updateTransaction(expense.id, { title: RULE_TITLE });
};

const seedCategoryRule = (categoryId: number) => {
    const [rule] = testDb
        .insert(RuleEntityTable)
        .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
        .returning()
        .all();

    testDb
        .insert(RuleConditionEntityTable)
        .values({
            ruleId: rule.id,
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: RULE_TITLE,
            secondaryValue: null
        })
        .run();
    testDb
        .insert(RuleActionEntityTable)
        .values({ ruleId: rule.id, type: RuleActionTypeEnum.SET_CATEGORY, categoryId, tagId: null, accountId: null })
        .run();

    return rule;
};

describe('rule/rule-category-skips-fee-and-consolidation-child', () => {
    it('categorizes only the primary leg of a visible transaction and leaves fee legs and consolidation children untouched', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const account = seed.account({ title: 'Rule fee account' });
        const expense = seedTitledExpense(account.id, 'rule-fee-expense');
        const parent = seedTitledExpense(account.id, 'rule-fee-parent');
        const child = seedTitledExpense(account.id, 'rule-fee-child');
        seed.feeEntry(expense.id, 'rule-fee-leg', { accountId: account.id, amount: 500_000 });
        testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: parent.id })
            .where(eq(TransactionEntityTable.id, child.id))
            .run();
        const rule = seedCategoryRule(category.id);

        const result = await ruleEngineService.applyRuleToMatchingTransactions(rule.id, null);
        const directlyCategorizedIds = await transactionRuleRepository.setCategoryByTransactionIds([child.id], category.id);
        const entries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(inArray(TransactionEntryEntityTable.transactionId, [expense.id, child.id]))
            .all();
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
    });
});
