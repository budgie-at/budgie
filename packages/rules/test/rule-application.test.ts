import {
    CategoryEntityTable,
    CategorySourceEnum,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TagSourceEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTagsEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { RuleEngineService, RuleService } from '@budgie/rules';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, testSeedService } from './context';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const RULE_TITLE = 'SPAR';

const titleContains = {
    field: RuleConditionFieldEnum.TITLE,
    operator: RuleConditionOperatorEnum.CONTAINS,
    value: RULE_TITLE,
    secondaryValue: null
};

const createRules = Effect.gen(function* () {
    const ruleService = yield* RuleService;
    const [firstCategory, secondCategory] = yield* testDb.select().from(CategoryEntityTable);
    const tag = yield* testSeedService.tag('groceries');

    yield* ruleService.create({
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [titleContains],
        actions: [{ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: firstCategory.id, tagId: null, accountId: null }]
    });
    yield* ruleService.create({
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [titleContains],
        actions: [
            { type: RuleActionTypeEnum.SET_CATEGORY, categoryId: secondCategory.id, tagId: null, accountId: null },
            { type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null }
        ]
    });

    return { firstCategory, tag };
});

const buildInput = (accountId: number): TransactionCreateInputInterface => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'SPAR MARKET',
    comment: '',
    externalId: null,
    operatedAt: new Date('2026-06-02T12:00:00.000Z'),
    toAccountId: null,
    fromAccountId: accountId,
    exchangeRate: 1,
    externalSource: null,
    updatedBy: null,
    amount: 10,
    tagIds: [],
    entries: [{ accountId, categoryId: null, mccCategoryId: null, type: TransactionEntryTypeEnum.CREDIT, amount: 10_000_000 }]
});

layer(TestLayer)('rules engine', it => {
    it.effect('applies the first SET_CATEGORY and every ADD_TAG to new transaction inputs with the RULE source', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { firstCategory, tag } = yield* createRules;
            const account = yield* testSeedService.account();

            const { transactionInputs, postCreateIndexes } = yield* ruleEngineService.prepareCreateInputsForRules([buildInput(account.id)]);
            const [prepared] = transactionInputs;

            expect(postCreateIndexes).toEqual([]);
            expect(prepared.tagIds).toEqual([]);
            expect(prepared.ruleTagIds).toEqual([tag.id]);
            expect(prepared.entries.map(entry => [entry.categoryId, entry.categorySource])).toEqual([
                [firstCategory.id, CategorySourceEnum.RULE]
            ]);
        })
    );

    it.effect('writes categorySource RULE and the tag when applying rules to stored transactions', () =>
        Effect.gen(function* () {
            const ruleEngineService = yield* RuleEngineService;
            const { firstCategory, tag } = yield* createRules;
            const account = yield* testSeedService.account();
            const expense = yield* testSeedService.bankPairExpense(
                { externalId: 'rule-application', operatedAt: new Date('2026-06-02T12:00:00.000Z') },
                { accountId: account.id, amount: 10_000_000 }
            );
            yield* testSeedService.updateTransaction(expense.id, { title: 'SPAR MARKET' });

            yield* ruleEngineService.applyRulesToTransactions([expense.id], [buildInput(account.id)]);

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, expense.id));
            const tags = yield* testDb
                .select()
                .from(TransactionTagsEntityTable)
                .where(eq(TransactionTagsEntityTable.transactionId, expense.id));

            expect(entries.map(entry => [entry.categoryId, entry.categorySource])).toEqual([[firstCategory.id, CategorySourceEnum.RULE]]);
            expect(tags.map(transactionTag => [transactionTag.tagId, transactionTag.source])).toEqual([[tag.id, TagSourceEnum.RULE]]);
        })
    );
});
